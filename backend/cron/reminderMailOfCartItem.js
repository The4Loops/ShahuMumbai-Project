// cron/reminderMailOfCartItem.js
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const dbPool = require('../utils/dbPool'); // <-- NEW: shared pool

let running = false;

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

async function sendCartReminderEmails() {
  const startTs = new Date().toISOString();
  let pool;
  try {
    pool = await dbPool.getPool();
  } catch (err) {
    console.error('[sendCartReminderMail] Failed to get DB pool:', err);
    return { status: 500, error: 'DB connection failed' };
  }

  try {
    const moduleResult = await pool.request()
      .input('mailtype', pool.NVarChar, 'cart_reminder_email')
      .query('SELECT maildescription, mailsubject FROM module WHERE mailtype = @mailtype');

    const moduleData = moduleResult.recordset[0];
    if (!moduleData) throw new Error('Email template not found');

    const mainTemplate = moduleData.maildescription;
    const mailsubject = moduleData.mailsubject || 'Your Cart is Waiting!';

    // Fetch all data
    const [cartResult, usersResult, productsResult] = await Promise.all([
      pool.request().query('SELECT UserId, ProductId, Quantity FROM carts'),
      pool.request().query('SELECT UserId, Email, FullName FROM users'),
      pool.request().query(`
        SELECT p.ProductId, p.Name, p.Price, p.DiscountPrice, p.ShortDescription,
               pi.image_url, pi.is_hero
        FROM products p
        LEFT JOIN product_images pi ON p.ProductId = pi.product_id
      `)
    ]);

    const cartData = cartResult.recordset;
    const usersData = usersResult.recordset;
    const productsData = productsResult.recordset;

    // Build maps
    const usersMap = Object.fromEntries(
      usersData.map(u => [u.UserId, { email: u.Email, fullName: u.FullName || 'Customer' }])
    );

    const productsMap = {};
    productsData.forEach(p => {
      if (!productsMap[p.ProductId]) {
        productsMap[p.ProductId] = {
          ...p,
          product_images: []
        };
      }
      if (p.image_url) {
        productsMap[p.ProductId].product_images.push({
          image_url: p.image_url,
          is_hero: p.is_hero === 'Y'
        });
      }
    });

    // Group carts by user
    const userCarts = {};
    cartData.forEach(item => {
      const user = usersMap[item.UserId];
      if (!user) return;

      if (!userCarts[item.UserId]) {
        userCarts[item.UserId] = {
          email: user.email,
          fullName: user.fullName,
          items: []
        };
      }

      const product = productsMap[item.ProductId];
      if (product) {
        userCarts[item.UserId].items.push({ ...item, products: product });
      }
    });

    // Setup email
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();

    const emailPromises = Object.values(userCarts).map(async ({ email, fullName, items }) => {
      if (!email) return;

      let cartItemsHtml = '';
      for (const item of items) {
        const p = item.products;
        if (!p) continue;

        const salePrice = p.DiscountPrice && p.DiscountPrice < p.Price
          ? (p.Price - p.DiscountPrice).toFixed(2)
          : p.Price.toFixed(2);

        const imageUrl = p.product_images.find(img => img.is_hero)?.image_url
          || 'https://via.placeholder.com/220';

        const description = p.ShortDescription || 'No description';

        cartItemsHtml += cartItemTemplate
          .replace(/{{image_url}}/g, imageUrl)
          .replace(/{{productName}}/g, p.Name.replace(/['"]/g, '&quot;'))
          .replace(/{{description}}/g, description.replace(/['"]/g, '&quot;'))
          .replace(/{{price}}/g, salePrice);
      }

      if (!cartItemsHtml) return;

      const emailHtml = mainTemplate.replace('{{cartItems}}', cartItemsHtml);
      const plainText = emailHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: mailsubject,
        html: emailHtml,
        text: plainText,
      });

      console.log(`[sendCartReminderMail] Email sent to ${email}`);
    });

    await Promise.all(emailPromises);

    console.log(`[Cron] Cart reminder emails sent to ${Object.keys(userCarts).length} users`);
    return { status: 200, message: 'Emails sent' };
  } catch (error) {
    console.error('[sendCartReminderMail] Error:', error);
    return { status: 500, error: error.message };
  }
}

// Export scheduler
module.exports = () => {
  cron.schedule(
    '0 8 */3 * *', // every 3 days at 8 AM
    async () => {
      if (running) {
        console.warn('[sendCartReminderMail] Previous run still in progress, skipping.');
        return;
      }
      running = true;
      try {
        await sendCartReminderEmails();
      } catch (err) {
        console.error('[Cron] Error in cart reminder task:', err);
      } finally {
        running = false;
      }
    },
    { timezone: 'Asia/Kolkata' }
  );

  console.log('Cart reminder scheduler started (every 3 days at 8 AM)');
};