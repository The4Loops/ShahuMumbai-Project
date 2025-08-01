const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
require('./cron/autounlock')();
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');


const app = express();

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
app.use('/api',categoryRoutes)

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
