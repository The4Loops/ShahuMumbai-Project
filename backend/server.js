require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const dbPool = require('./utils/dbPool');

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
const paymentsController = require('./controllers/paymentsController');

const app = express();
app.set('trust proxy', 1);
app.set('etag', false);
app.use(helmet());

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

app.use(async (req, _res, next) => {
  try {
    req.db = await dbPool.getPool();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/api/orders/diag', async (req, res) => {
  try {
    const id = await req.db.request().query(
      "SELECT DB_NAME() AS currentDb, @@SERVERNAME AS serverName"
    );

    const { currentDb, serverName } = id.recordset[0];
    const envDb = process.env.SQL_DATABASE || process.env.DB_DATABASE || process.env.DB_NAME || 'ShahuMumbai';
    const fqnCurrent = `[${currentDb}].[dbo].[Orders]`;
    const fqnEnv     = `[${envDb}].[dbo].[Orders]`;

    const count = async (fqn) => {
      const q = `
        IF OBJECT_ID('${fqn}','U') IS NOT NULL
          SELECT COUNT(*) AS c FROM ${fqn} WITH (NOLOCK)
        ELSE
          SELECT -1 AS c;
      `;
      const r = await req.db.request().query(q);
      return r.recordset[0].c;
    };

    const count_currentDb = await count(fqnCurrent);
    const count_envDb     = await count(fqnEnv);

    let sample = [];
    if (count_envDb > 0) {
      const s = await req.db.request().query(
        `SELECT TOP (3) OrderId, OrderNumber, CustomerName, Status, FulFillmentStatus, PlacedAt
         FROM ${fqnEnv} WITH (NOLOCK)
         ORDER BY PlacedAt DESC`
      );
      sample = s.recordset;
    }

    res.json({
      ok: true,
      serverName,
      currentDb,
      fqn_currentDb: fqnCurrent,
      fqn_envDb: fqnEnv,
      count_currentDb,
      count_envDb,
      sample
    });
  } catch (e) {
    console.error('[diag] error', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.use((req, res, next) => (req.method === 'OPTIONS' ? res.sendStatus(204) : next()));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.post('/api/payments/webhook', express.raw({ type: '*/*' }), paymentsController.webhook);
app.use(express.json());
app.use(rateLimit({ windowMs: 30 * 60 * 1000, max: 1000 }));
app.use(guestSession);
app.use(optional);

// Mount Routes
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
app.use('/api/orders',ordersRoutes);
app.use('/api', contactUsRoutes);
app.use('/api', teamMembersRoutes);
app.use('/api', collectionsRoutes);
app.use('/api', subscriberRoutes);
app.use('/api', wishlistRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api', heritageRoutes);
app.use('/api', standaloneRoutes);
app.use('/api', waitlistRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  if (dbPool.close) await dbPool.close();
  process.exit(0);
});
