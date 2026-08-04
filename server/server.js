import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import swaggerUi from 'swagger-ui-express';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import groupBookingRouter from './routes/groupBookingRoutes.js';
import waitlistRouter from './routes/waitlistRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import theaterRouter from './routes/theaterRoutes.js';
import screenRouter from './routes/screenRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import recommendationRouter from './routes/recommendationRoutes.js';
import couponRouter from './routes/couponRoutes.js';
import pricingRuleRouter from './routes/pricingRuleRoutes.js';
import menuRouter from './routes/menuRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger, httpLogger } from './configs/logger.js';
import { swaggerSpec } from './configs/swagger.js';

const app = express();
const port = process.env.PORT || 3000;

await connectDB();

app.use(httpLogger);

// stripe webhooks route
app.use('/api/stripe' , express.raw({ type: 'application/json' }) , stripeWebhooks);

// origins allowed to call this API (comma-separated in CORS_ORIGIN)
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'https://movietix-rho.vercel.app'];

// Middleware
app.use(express.json());
app.use(cors({ origin: allowedOrigins }));
app.use(clerkMiddleware())


// API Routes
app.get('/', (req, res) => res.send('Server is Live!'))
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use('/api/inngest', serve({ client: inngest, functions }))
app.use('/api/show', showRouter)
app.use('/api/booking', bookingRouter);
app.use('/api/group-booking', groupBookingRouter);
app.use('/api/waitlist', waitlistRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/theater', theaterRouter);
app.use('/api/screen', screenRouter);
app.use('/api/review', reviewRouter);
app.use('/api/recommendations', recommendationRouter);
app.use('/api/coupon', couponRouter);
app.use('/api/pricing-rule', pricingRuleRouter);
app.use('/api/menu', menuRouter);

// 404 + centralized error handling (must be registered after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => logger.info(`Server listening at http://localhost:${port}`));
