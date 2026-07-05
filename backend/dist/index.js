"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const api_1 = __importDefault(require("./routes/api"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '5000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';
const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:80', 'http://localhost'];
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
}));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
            callback(null, true);
        }
        else if (!isProd) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
if (!isProd) {
    app.use((req, _res, next) => {
        if (req.method !== 'GET') {
            console.log(`[${req.method}] ${req.url}`);
        }
        next();
    });
}
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 500 : 1000,
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);
app.use('/auth', limiter);
app.get('/health', async (_req, res) => {
    try {
        await prisma_1.default.$queryRaw `SELECT 1`;
        res.json({ status: 'ok', database: 'connected', env: NODE_ENV });
    }
    catch {
        res.status(503).json({ status: 'error', database: 'disconnected' });
    }
});
app.use('/auth', authRoutes_1.default);
app.use('/api', api_1.default);
app.get('/', (_req, res) => {
    res.json({
        name: 'Construction ERP API',
        version: '1.0.0',
        health: '/health',
    });
});
app.use((err, _req, res, _next) => {
    console.error(err.stack || err.message);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(!isProd && { error: err }),
    });
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Construction ERP API running on port ${PORT} (${NODE_ENV})`);
});
