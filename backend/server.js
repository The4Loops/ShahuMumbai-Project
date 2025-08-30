const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
require('./cron/autounlock')();
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const designerRoutes = require('./routes/designerRoutes');
const productDesignerRoutes = require('./routes/productDesignerController');
const userRoutes=require('./routes/userRoutes');
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
const contactUsRoutes=require('./routes/contactUsRoutes');
const teamMembersRoutes=require('./routes/teamMembersRoutes');
const collectionsRoutes = require('./routes/collectionsRoutes');

const app = express();

app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
   origin:process.env.REACT_APP_API_BASE_URL,
  credentials: true    
}));
app.use(express.json());

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    styleSrc: ["'self'", "https://fonts.googleapis.com"],
    fontSrc: ["https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'",process.env.REACT_Server_API_BASE_URL],
    objectSrc: ["'none'"]
  }
}));
app.disable('x-powered-by');

// Routes
app.use('/api/auth',authRoutes);
app.use('/api',productRoutes);
app.use('/api',categoryRoutes);
app.use('/api', uploadRoutes);
app.use('/api', designerRoutes);
app.use('/api',productDesignerRoutes);
app.use('/api',userRoutes);
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
app.use('/api',contactUsRoutes);
app.use('/api',teamMembersRoutes);
app.use('/api', collectionsRoutes); 



// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
