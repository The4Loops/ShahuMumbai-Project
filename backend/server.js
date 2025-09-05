// server.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Cron jobs
require('./cron/autounlock')();
require('./cron/reminderMailOfCartItem')();

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const designerRoutes = require('./routes/designerRoutes');
const productDesignerRoutes = require('./routes/productDesignerController');
const userRoutes = require('./routes/userRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const navbarRoutes = require('./routes/navbarRoutes');
const roleRoutes = require('./routes/roleRoutes');
const menuRoutes = require('./routes/menuRoutes');
const blogRoutes = require('./routes/blogRoutes');
const cartRoutes = require('./routes/cartRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const contactUsRoutes = require('./routes/contactUsRoutes');
const teamMembersRoutes = require('./routes/teamMembersRoutes');
const collectionsRoutes = require('./routes/collectionsRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes'); 

const app = express();
app.set('trust proxy', 1);

// --- Security headers (Helmet defaults) ---
app.use(helmet());

// --- CORS (frontend origin) ---
app.use(
  cors({
    origin: process.env.REACT_APP_API_BASE_URL, // e.g. http://localhost:3000
    credentials: true,
  })
);

// --- JSON parser (safe; webhook route uses express.raw locally) ---
app.use(express.json());

// --- Content Security Policy (allow Razorpay assets) ---
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.razorpay.com"],
      connectSrc: [
        "'self'",
        process.env.REACT_APP_API_BASE_URL,
        "https://api.razorpay.com",
        "https://*.razorpay.com",
      ],
      frameSrc: ["'self'", "https://*.razorpay.com"],
      objectSrc: ["'none'"],
    },
  })
);

app.disable('x-powered-by');

// --- Rate limiting (put BEFORE routes) ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// --- Health check ---
app.get('/health', (_req, res) => res.json({ ok: true }));

// --- Mount routes ---
app.use('/api/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/api', categoryRoutes);
app.use('/api', uploadRoutes);
app.use('/api', designerRoutes);
app.use('/api', productDesignerRoutes);
app.use('/api', userRoutes);
app.use('/api', bannerRoutes);
app.use('/api', reviewRoutes);
app.use('/api/navbar', navbarRoutes);
app.use('/api', roleRoutes);
app.use('/api', menuRoutes);
app.use('/api', blogRoutes);
app.use('/api', cartRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', checkoutRoutes);
app.use('/api', ordersRoutes);
app.use('/api', contactUsRoutes);
app.use('/api', teamMembersRoutes);
app.use('/api', collectionsRoutes);
app.use('/api', subscriberRoutes);
app.use('/api', wishlistRoutes);
app.use('/api/payments', paymentsRoutes); // Razorpay routes

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
