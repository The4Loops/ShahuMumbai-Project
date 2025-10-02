const cron = require("node-cron");
const sql = require('mssql');
const nodemailer = require("nodemailer");
const sqlConfig = require("../config/db");

const cartItemTemplate = `
<tr>
  <td style="padding:0 24px 18px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef2f7;border-radius:8px;margin-bottom:12px;">
      <tr>
        <td width="140" class="stack" style="padding:12px;" align="center">
          <img src="{{image_url}}" alt="{{productName}}" width="120" class="product-img" style="display:block;border-radius:6px;max-width:120px;">
        </td>
        <td style="padding:12px;vertical-align:top;" class="stack">
          <h3 style="margin:0 0 6px 0;font-size:16px;color:#111827;">{{productName}}</h3>
          <p style="margin:0 0 8px 0;font-size:14px;color:#6b7280;">{{description}}</p>
          <p style="margin:0 0 12px 0;font-size:16px;font-weight:700;color:#0f172a;">₹{{price}}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>
`;

let running = false;
let pool;

async function initPool() {
  try {
    pool = await sql.connect(sqlConfig);
    console.log('MSSQL pool connected for cron');
  } catch (err) {
    console.error('Failed to connect MSSQL pool for cron:', err);
    throw err;
  }
}

async function sendCartReminderEmails() {
  const startTs = new Date().toISOString();
  try {
    const moduleResult = await pool.request()
      .input('mailtype', sql.NVarChar, 'cart_reminder_email')
      .query('SELECT maildescription, mailsubject FROM module WHERE mailtype = @mailtype');

    const moduleData = moduleResult.recordset[0];
    if (!moduleData) {
      throw new Error('Template not found');
    }

    const mainTemplate = moduleData.maildescription;
    const mailsubject = moduleData.mailsubject || 'Your Cart is Waiting!';

    // Fetch cart data
    const cartResult = await pool.request().query('SELECT UserId, ProductId, Quantity FROM carts');
    const cartData = cartResult.recordset;

    // Fetch all users
    const usersResult = await pool.request().query('SELECT UserId, Email, FullName FROM users');
    const usersData = usersResult.recordset;

    // Fetch all products with images
    const productsResult = await pool.request().query(`
      SELECT 
        p.ProductId, p.Name, p.Price, p.DiscountPrice, p.ShortDescription,
        pi.image_url, pi.is_hero
      FROM products p
      LEFT JOIN product_images pi ON p.ProductId = pi.product_id
    `);
    const productsData = productsResult.recordset;

    // Create a map for users and products for quick lookup
    const usersMap = {};
    usersData.forEach((user) => {
      usersMap[user.UserId] = {
        email: user.Email,
        fullName: user.FullName || 'Customer',
      };
    });

    const productsMap = {};
    productsData.forEach((product) => {
      if (!productsMap[product.ProductId]) {
        productsMap[product.ProductId] = {
          ...product,
          product_images: [],
        };
      }
      if (product.image_url) {
        productsMap[product.ProductId].product_images.push({
          image_url: product.image_url,
          is_hero: product.is_hero === 'Y' ? true : false,
        });
      }
    });

    // Organize cart data by user
    const userCarts = {};
    cartData.forEach((item) => {
      const userId = item.UserId;
      if (!usersMap[userId]) {
        console.warn(`[sendCartReminderMail] Skipping cart for user ${userId}: No user found`);
        return;
      }
      if (!userCarts[userId]) {
        userCarts[userId] = {
          email: usersMap[userId].email,
          fullName: usersMap[userId].fullName,
          items: [],
        };
      }
      if (productsMap[item.ProductId]) {
        userCarts[userId].items.push({
          ...item,
          products: productsMap[item.ProductId],
        });
      } else {
        console.warn(`[sendCartReminderMail] Skipping product ${item.ProductId} for user ${userId}: No product found`);
      }
    });

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('Transporter error:', error);
          reject(new Error('Email transporter verification failed: ' + error.message));
        } else {
          console.log('Transporter is ready');
          resolve();
        }
      });
    });

    const emailPromises = Object.entries(userCarts).map(async ([userId, { email, fullName, items }]) => {
      if (!email) {
        console.warn(`[sendCartReminderMail] Skipping user ${userId}: No email found`);
        return;
      }

      let cartItemsHtml = '';
      items.forEach((item) => {
        const product = item.products;
        if (!product) return;
        const escapedName = product.Name ? product.Name.replace(/['"]/g, '&quot;') : 'Unknown Product';
        const salePrice = product.DiscountPrice && product.DiscountPrice < product.Price
          ? (product.Price - product.DiscountPrice).toFixed(2)
          : product.Price.toFixed(2);
        const imageUrl = product.product_images?.find((img) => img.is_hero)?.image_url
          || 'https://via.placeholder.com/220';
        const description = product.ShortDescription || 'No description available';

        const itemHtml = cartItemTemplate
          .replace(/{{image_url}}/g, imageUrl)
          .replace(/{{productName}}/g, escapedName)
          .replace(/{{description}}/g, description.replace(/['"]/g, '&quot;'))
          .replace(/{{price}}/g, salePrice);

        cartItemsHtml += itemHtml;
      });

      if (!cartItemsHtml) {
        console.warn(`[sendCartReminderMail] Skipping user ${userId}: No valid cart items`);
        return;
      }

      const emailHtml = mainTemplate.replace('{{cartItems}}', cartItemsHtml);
      const plainTextContent = emailHtml
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      return transporter
        .sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: mailsubject,
          html: emailHtml,
          text: plainTextContent,
        })
        .then(() => console.log(`[sendCartReminderMail] Email sent to ${email}`));
    });

    await Promise.all(emailPromises);

    const message = `Cart reminder emails sent to ${Object.keys(userCarts).length} user(s)`;
    console.log(`[Cron] ${message}`);
    return { status: 200, message };
  } catch (error) {
    console.error('Error:', error);
    return { status: 500, error: error.message };
  }
}

module.exports = async () => {
  try {
    await initPool();
  } catch (err) {
    console.error('Failed to initialize pool for cron:', err);
    return;
  }

  cron.schedule(
    '0 8 */3 * *',
    async () => {
      if (running) {
        console.warn('[sendCartReminderMail] Previous run still in progress, skipping.');
        return;
      }
      running = true;
      try {
        await sendCartReminderEmails();
      } catch (err) {
        console.error('[Cron] Error in scheduled task:', err);
      } finally {
        running = false;
      }
    },
    { timezone: 'Asia/Kolkata' }
  );

  console.log('Cart reminder scheduler started');
};