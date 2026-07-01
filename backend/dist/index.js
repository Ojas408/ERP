import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import authRoutes from './routes/authRoutes';
import apiRoutes from './routes/api';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// Security Middlewares
app.use(helmet({
    crossOriginResourcePolicy: false, // Ensure local assets can be requested across origins (frontend -> backend)
}));
app.use(cors());
app.use(express.json());
// Serve uploads folder statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// Request Logger
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url} - Body:`, req.body);
    next();
});
// Rate Limiting Middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);
app.use('/auth', limiter);
// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.get('/', (req, res) => {
    res.send('Construction ERP SaaS Backend is running');
});
// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { error: err })
    });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
