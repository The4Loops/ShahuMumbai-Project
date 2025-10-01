require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
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
        process.exit(1); // Exit if DB connection fails
    }
}

// Call the function to initialize the pool
initDatabasePool();

// Make the pool available to routes via middleware
app.use((req, res, next) => {
    req.dbPool = pool;
    next();
});

// Security headers (Helmet defaults)
app.use(helmet());

// CORS
app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Cookies (before guestSession)
app.use(cookieParser(process.env.COOKIE_SECRET));

// JSON parser
app.use(express.json());

// Content Security Policy
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
                process.env.FRONTEND_ORIGIN || "http://localhost:3000",
                process.env.API_ORIGIN || "http://localhost:5000",
                "https://api.razorpay.com",
                "https://*.razorpay.com",
            ],
            frameSrc: ["'self'", "https://*.razorpay.com"],
            objectSrc: ["'none'"],
        },
    })
);

app.disable('x-powered-by');

// Rate limiting
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
    })
);

// Guest session
app.use(guestSession);

// Optional auth
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
