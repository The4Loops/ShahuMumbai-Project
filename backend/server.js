require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const sql = require('mssql');
const sqlConfig = require('./config/db');

// Cron jobs 
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

const FRONTEND = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const API_ORIGIN = process.env.API_ORIGIN || 'http://localhost:5000';
const PORT = process.env.PORT || 5000;

const app = express();
app.set('trust proxy', 1);

let pool;
async function initDatabasePool() {
  const conn = new sql.ConnectionPool(sqlConfig);
  conn.on('error', (err) => {
    console.error('MSSQL pool error:', err);
  });
  await conn.connect();
  pool = conn;
  console.log('✅ Connected to MSSQL database');
}
function requirePool(req, res, next) {
  if (!pool || !pool.connected) {
    return res.status(503).json({ error: 'Service unavailable. DB not ready.' });
  }
  req.dbPool = pool;
  next();
}

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, 
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(
  cors({
    origin: FRONTEND,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.options('*', cors()); 

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(compression());

app.use(express.json({ limit: '1mb' }));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdnjs.cloudflare.com",
        "https://checkout.razorpay.com",
      ],
      styleSrc: [
        "'self'",
        "https://fonts.googleapis.com",
        // If you truly rely on inline styles (try to avoid):
        // "'unsafe-inline'",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://*.razorpay.com",
        // add your CDN(s) / S3 bucket origin(s) if any
      ],
      connectSrc: [
        "'self'",
        FRONTEND,
        API_ORIGIN,
        "https://api.razorpay.com",
        "https://*.razorpay.com",
      ],
      frameSrc: ["'self'", "https://*.razorpay.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  })
);

app.disable('x-powered-by');

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(guestSession);

app.use(optional);

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));



// ---------- DB injection ----------
app.use(requirePool);

// ---------- Routes ----------
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
app.use('/api/wishlist', wishlistRoutes); 
app.use('/api/payments', paymentsRoutes);
app.use('/api', heritageRoutes);


app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});


app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: 'internal_error' });
});


async function start() {
  try {
    await initDatabasePool();
    app.listen(PORT, () => {
      console.log(`✅ Server running on ${API_ORIGIN || `http://localhost:${PORT}`}`);
    });
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}
start();


async function shutdown() {
  console.log('Shutting down server...');
  try {
    if (pool) {
      await pool.close();
      console.log('Database pool closed');
    }
  } catch (e) {
    console.error('Error during pool close:', e);
  } finally {
    process.exit(0);
  }
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
