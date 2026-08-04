import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { resourceRouter } from './routes/resource.routes';
import { reviewRouter } from './routes/review.routes';
import { assignmentRouter } from './routes/assignment.routes';
import { bookmarkRouter } from './routes/bookmark.routes';
import { ratingRouter } from './routes/rating.routes';
import { commentRouter } from './routes/comment.routes';
import { notificationRouter } from './routes/notification.routes';
import { leaderboardRouter } from './routes/leaderboard.routes';
import { gamificationRouter } from './routes/gamification.routes';
import { adminRouter } from './routes/admin.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { searchRouter } from './routes/search.routes';
import { reportRouter } from './routes/report.routes';
import { branchRouter } from './routes/branch.routes';
import { subjectRouter } from './routes/subject.routes';

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static file serving for local uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/resources', resourceRouter);
app.use('/api/review', reviewRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/bookmarks', bookmarkRouter);
app.use('/api/ratings', ratingRouter);
app.use('/api/comments', commentRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/gamification', gamificationRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/search', searchRouter);
app.use('/api/reports', reportRouter);
app.use('/api/branches', branchRouter);
app.use('/api/subjects', subjectRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
