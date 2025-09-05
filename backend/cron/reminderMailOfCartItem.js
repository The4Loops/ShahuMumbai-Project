const cron = require("node-cron");
const supabase = require("../config/supabaseClient");
const nodemailer = require("nodemailer");

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

async function sendCartReminderEmails(req, res) {
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

    const mainTemplate = moduleData.maildescription;
    const mailsubject = moduleData.mailsubject || "Your Cart is Waiting!";

    // Fetch cart data
    const { data: cartData, error: cartError } = await supabase
      .from("carts")
      .select("user_id, product_id, quantity");

    if (cartError) {
      throw new Error("Error fetching cart data: " + cartError.message);
    }

    // Fetch all users
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name");

    if (usersError) {
      throw new Error("Error fetching users data: " + usersError.message);
    }

    // Fetch all products with images
    const { data: productsData, error: productsError } = await supabase.from(
      "products"
    ).select(`
        id,
        name,
        price,
        discountprice,
        shortdescription,
        product_images(image_url, is_hero)
      `);

    if (productsError) {
      throw new Error("Error fetching products data: " + productsError.message);
    }

    // Create a map for users and products for quick lookup
    const usersMap = {};
    usersData.forEach((user) => {
      usersMap[user.id] = {
        email: user.email,
        full_name: user.full_name || "Customer",
      };
    });

    const productsMap = {};
    productsData.forEach((product) => {
      productsMap[product.id] = product;
    });

    // Organize cart data by user
    const userCarts = {};
    cartData.forEach((item) => {
      const userId = item.user_id;
      if (!usersMap[userId]) {
        console.warn(
          `[sendCartReminderMail] Skipping cart for user ${userId}: No user found`
        );
        return;
      }
      if (!userCarts[userId]) {
        userCarts[userId] = {
          email: usersMap[userId].email,
          fullName: usersMap[userId].full_name,
          items: [],
        };
      }
      if (productsMap[item.product_id]) {
        userCarts[userId].items.push({
          ...item,
          products: productsMap[item.product_id],
        });
      } else {
        console.warn(
          `[sendCartReminderMail] Skipping product ${item.product_id} for user ${userId}: No product found`
        );
      }
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error("Transporter error:", error);
          reject(
            new Error("Email transporter verification failed: " + error.message)
          );
        } else {
          console.log("Transporter is ready");
          resolve();
        }
      });
    });

    const emailPromises = Object.entries(userCarts).map(
      async ([userId, { email, fullName, items }]) => {
        if (!email) {
          console.warn(
            `[sendCartReminderMail] Skipping user ${userId}: No email found`
          );
          return;
        }

        let cartItemsHtml = "";
        items.forEach((item) => {
          const product = item.products;
          if (!product) return;
          console.log("Product name:", product.name);
          const escapedName = product.name ? product.name.replace(/['"]/g, '&quot;') : 'Unknown Product';
          console.log('Escaped name:', escapedName);
          const salePrice =
            product.discountprice && product.discountprice < product.price
              ? (product.price - product.discountprice).toFixed(2)
              : product.price.toFixed(2);
          const imageUrl =
            product.product_images?.find((img) => img.is_hero)?.image_url ||
            "https://via.placeholder.com/220";
          const description =
            product.shortdescription || "No description available";

          const itemHtml = cartItemTemplate
            .replace("{{image_url}}", imageUrl)
            .replace("{{productName}}",escapedName)
            .replace("{{description}}", description.replace(/['"]/g, "&quot;"))
            .replace("{{price}}", salePrice);

          console.log("itemHtml:", itemHtml); // Log to verify {{name}} replacement
          cartItemsHtml += itemHtml;
        });

        if (!cartItemsHtml) {
          console.warn(
            `[sendCartReminderMail] Skipping user ${userId}: No valid cart items`
          );
          return;
        }

        const emailHtml = mainTemplate.replace("{{cartItems}}", cartItemsHtml);
        const plainTextContent = emailHtml
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim();

        console.log(`[sendCartReminderMail] Sending email to ${email}`);
        return transporter
          .sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: mailsubject,
            html: emailHtml,
            text: plainTextContent,
          })
          .then(() =>
            console.log(`[sendCartReminderMail] Email sent to ${email}`)
          );
      }
    );

    await Promise.all(emailPromises);

    const message = `Cart reminder emails sent to ${
      Object.keys(userCarts).length
    } user(s)`;
    console.log(`[Cron] ${message}`);
    return { status: 200, message };
  } catch (error) {
    console.error("Error:", error);
    return { status: 500, error: error.message };
  }
}

module.exports = () => {
  cron.schedule(
    "* * * * *",
    async () => {
      if (running) {
        console.warn(
          "[sendCartReminderMail] Previous run still in progress, skipping."
        );
        return;
      }
      running = true;
      try {
        await sendCartReminderEmails(
          {},
          {
            status: () => ({
              json: (data) => console.log("[Cron] " + data.message),
            }),
          }
        );
      } catch (err) {
        console.error("[Cron] Error in scheduled task:", err);
      } finally {
        running = false;
      }
    },
    { timezone: "Asia/Kolkata" }
  );

  console.log("Cart reminder scheduler started");
};
