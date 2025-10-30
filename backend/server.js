require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const sql = require('mssql');
const sqlConfig = require('./config/db');

// Middlewares
const guestSession = require('./middleware/guestSession');
const { optional } = require('./middleware/auth');

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
const heritageRoutes = require('./routes/heritageRoutes');
const standaloneRoutes = require('./routes/standaloneRoutes');
const waitlistRoutes = require('./routes/waitlistRoutes');

// Payment controller for webhook
const paymentsController = require('./controllers/paymentsController');

const app = express();
app.set('trust proxy', 1);

// ✅ Create pool here & keep it global inside this file
let pool;

// ✅ Initialize DB Pool
async function initDatabasePool() {
  try {
    pool = await sql.connect(sqlConfig);
    console.log('✅ Connected to MSSQL database');

    // ✅ Start cron jobs AFTER DB is ready
    require('./cron/autounlock')();
    require('./cron/reminderMailOfCartItem')();

  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
}
initDatabasePool();

// ✅ Attach pool to every request
app.use((req, _res, next) => {
  req.dbPool = pool;
  next();
});

// Security headers
app.use(helmet());

// --- CORS ---
const rawAllowed = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const allowed = rawAllowed.split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
const isDev = process.env.NODE_ENV !== 'production';
console.log('CORS Allowed Origins:', allowed);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || isDev) return cb(null, true);
    const normalized = origin.replace(/\/$/, '');
    const ok =
      allowed.includes(normalized) ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized);
    return ok ? cb(null, true) : cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Fast OPTIONS
app.use((req, res, next) => (req.method === 'OPTIONS' ? res.sendStatus(204) : next()));

app.use(cookieParser(process.env.COOKIE_SECRET));

/**
 * ✅ Webhook BEFORE JSON parser (raw body required)
 */
app.post('/api/payments/webhook', express.raw({ type: '*/*' }), paymentsController.webhook);

// ✅ Now global JSON parsing for everything else
app.use(express.json());

app.use(rateLimit({ windowMs: 30 * 60 * 1000, max: 1000 }));

// Sessions / auth
app.use(guestSession);
app.use(optional);

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Mounted Routes
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
app.use('/api/orders', ordersRoutes);
app.use('/api', contactUsRoutes);
app.use('/api', teamMembersRoutes);
app.use('/api', collectionsRoutes);
app.use('/api', subscriberRoutes);
app.use('/api', wishlistRoutes);
app.use('/api/payments', paymentsRoutes); 
app.use('/api', heritageRoutes);
app.use('/api', standaloneRoutes);
app.use('/api', waitlistRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  if (pool) await pool.close();
  process.exit(0);
});
