const cron = require("node-cron");
const supabase = require("../config/supabaseClient");
const nodemailer = require('nodemailer');

const cartItemTemplate = `
<tr>
  <td style="padding:0 24px 18px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef2f7;border-radius:8px;margin-bottom:12px;">
      <tr>
        <td width="140" class="stack" style="padding:12px;" align="center">
          <img src="{{image_url}}" alt="{{name}}" width="120" class="product-img" style="display:block;border-radius:6px;max-width:120px;">
        </td>
        <td style="padding:12px;vertical-align:top;" class="stack">
          <h3 style="margin:0 0 6px 0;font-size:16px;color:#111827;">{{name}}</h3>
          <p style="margin:0 0 8px 0;font-size:14px;color:#6b7280;">{{description}}</p>
          <p style="margin:0 0 12px 0;font-size:16px;font-weight:700;color:#0f172a;">₹{{price}}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>
`;

let running = false;

async function sendCartReminderEmails(req,res) {
    const startTs = new Date().toISOString();
    try {
    const { data: moduleData, error: moduleError } = await supabase
      .from("module")
      .select("maildescription,mailsubject")
      .eq("mailtype", "cart_reminder_email")
      .single();

    if (moduleError || !moduleData) {
      throw new Error(
        "Template not found: " + (moduleError?.message || "No data")
      );
    }

    const mainTemplate = moduleData.template_html;
    const mailsubject = moduleData.mailsubject || "Your Cart is Waiting!";

    const { data: cartData, error: cartError } = await supabase.from("carts")
      .select(`
        user_id,
        users:users!user_id(id, email, full_name),
        product_id,
        quantity,
        products:products!product_id(
          id,
          name,
          price,
          discountprice,
          shortdescription,
          product_images(image_url, is_hero)
        )
      `);

    if (cartError) {
      throw new Error("Error fetching cart data: " + cartError.message);
    }

    const userCarts = {};
    cartData.forEach((item) => {
      const userId = item.user_id;
      if (!userCarts[userId]) {
        userCarts[userId] = {
          email: item.users?.email,
          fullName: item.users?.full_name || "Customer",
          items: [],
        };
      }
      userCarts[userId].items.push(item);
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
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
        const salePrice = product.discountprice && product.discountprice < product.price
          ? (product.price - product.discountprice).toFixed(2)
          : product.price.toFixed(2);
        const imageUrl = product.product_images?.find(img => img.is_hero)?.image_url ||
                         'https://via.placeholder.com/220';
        const description = product.shortdescription || 'No description available';

        cartItemsHtml += cartItemTemplate
          .replace('{{image_url}}', imageUrl)
          .replace('{{name}}', product.name.replace(/['"]/g, '&quot;'))
          .replace('{{description}}', description.replace(/['"]/g, '&quot;'))
          .replace('{{price}}', salePrice);
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

        return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: mailsubject,
        html: emailHtml,
        text: plainTextContent,
      });
    });

    await Promise.all(emailPromises);

    res.status(200).json({
      message: `Cart reminder emails sent to ${Object.keys(userCarts).length} user(s)`,
    });

  } catch (error) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

module.exports=()=>{
cron.schedule('0 8 */3 * *', async () => {
    if (running) {
      console.warn('[sendCartReminderMail] Previous run still in progress, skipping.');
      return;
    }
    running = true;
    try {
      await sendCartReminderEmails({}, {
        status: () => ({ json: (data) => console.log('[Cron] ' + data.message) }),
      });
    } catch (err) {
      console.error('[Cron] Error in scheduled task:', err);
    } finally {
      running = false;
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('Cart reminder scheduler started');
}