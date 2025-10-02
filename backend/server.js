require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const sql = require('mssql');
const sqlConfig = require('./config/db');

// Cron jobs (leave these as-is)
require('./cron/autounlock')();
require('./cron/reminderMailOfCartItem')();

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
const standaloneRoutes = require('./routes/standaloneRoutes'); // <-- public subscribe route

const app = express();
app.set('trust proxy', 1);

// Initialize MSSQL connection pool
let pool;
async function initDatabasePool() {
  try {
    pool = await sql.connect(sqlConfig);
    console.log('✅ Connected to MSSQL database');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
}
initDatabasePool();

// Expose the pool to routes
app.use((req, _res, next) => {
  req.dbPool = pool;
  next();
});

// Security headers (Helmet defaults)
app.use(helmet());

// --- CORS (allow multiple frontends) ---
// CORS
const rawAllowed = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const allowed = rawAllowed
  .split(',')
  .map(s => s.trim().replace(/\/$/, '')) // strip trailing slash
  .filter(Boolean);

console.log('CORS allowed origins:', allowed);

const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: (origin, cb) => {
    // allow server-to-server/curl and anything in dev
    if (!origin || isDev) return cb(null, true);

    const normalized = origin.replace(/\/$/, '');
    const ok = allowed.includes(normalized)
      || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized); // safety for local

    if (ok) return cb(null, true);

    console.warn('Blocked by CORS:', origin);
    return cb(null, false); // don't throw; just deny CORS
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


// Cookies (before guestSession)
app.use(cookieParser(process.env.COOKIE_SECRET));

// JSON parser
app.use(express.json());

// Content Security Policy
const connectSrc = [
  "'self'",
  ...allowed,
  process.env.API_ORIGIN,
  "https://api.razorpay.com",
  "https://*.razorpay.com",
  "https://yourdomain.com",  // Add your domain
  "https://*.supabase.co",  // For Supabase
  "https://res.cloudinary.com",  // For Cloudinary
];

const imgSrc = [
  "'self'", 
  "data:", 
  "https://*.razorpay.com",
  "https://res.cloudinary.com",  // Add Cloudinary
  "https://yourdomain.com",  // Your domain
];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["https://fonts.gstatic.com"],
      imgSrc,
      connectSrc,
      frameSrc: ["'self'", "https://*.razorpay.com"],
      objectSrc: ["'none'"],
    },
  })
);

app.disable('x-powered-by');

// Rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Guest session + optional auth
app.use(guestSession);
app.use(optional);

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Mount routes
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
app.use('/api/payments', paymentsRoutes);
app.use('/api', heritageRoutes);
app.use('/api', standaloneRoutes); // <-- public subscribe endpoint

if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, 'client-build')));  // Upload frontend build to /client-build folder

  // Handle SPA routing (for React/Vue/etc.)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'client-build', 'index.html'));
    }
  });
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  if (pool) {
    await pool.close();
    console.log('Database pool closed');
  }
  process.exit(0);
});
