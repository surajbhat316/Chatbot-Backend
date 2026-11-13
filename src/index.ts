import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes';
import { connectDatabase } from './config/database';
import { initFirebase } from './config/firebase';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root documentation & status endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Chat Backend API',
    description: 'Node.js + TypeScript + MySQL (Sequelize) + Firebase Firestore',
    endpoints: {
      '1. Create or Get Chat': 'POST /chat/create',
      '2. Send Message': 'POST /chat/:chatId/message/send',
      '3. Get Messages': 'GET /chat/:chatId/messages?limit=50',
      '4. Mark Message Read': 'POST /chat/:chatId/message/:messageId/read',
      '5. Update Last Seen': 'POST /chat/:chatId/lastseen',
      '6. List User Chats': 'GET /user/:userId/chats',
      'Helper. Create User': 'POST /user/create',
    },
  });
});

// API Routes
app.use('/', routes);

// 404 Not Found Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start Server and Initialize Database & Firebase
const startServer = async () => {
  // Connect to MySQL via Sequelize
  await connectDatabase();

  // Initialize Firebase Admin SDK
  initFirebase();

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
};

startServer();
