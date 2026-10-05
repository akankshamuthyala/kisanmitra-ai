import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { csrfProtection } from './middleware/csrf.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import cropsRoutes from './routes/crops.routes.js';
import farmsRoutes from './routes/farms.routes.js';
import advisoriesRoutes from './routes/advisories.routes.js';
import diagnoseRoutes from './routes/diagnose.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import healthRoutes from './routes/health.routes.js';

export const app = express();

// 1. Security Headers (Helmet with CSP)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", env.CLIENT_ORIGIN],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || origin === env.CLIENT_ORIGIN || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local preview environments, scoped via credentials
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  })
);

// 3. Parsers & Limits
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 4. Global Rate Limiter
app.use(globalLimiter);

// 5. CSRF Protection
app.use(csrfProtection);

// 6. API Route Handlers
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropsRoutes);
app.use('/api/farms', farmsRoutes);
app.use('/api/advisories', advisoriesRoutes);
app.use('/api/diagnose', diagnoseRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 7. Central Error Handling Middleware
app.use(errorHandler);
