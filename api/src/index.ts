import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { prisma } from './prisma/client';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`🚀 StudyMate API running on http://localhost:${PORT}`);
      console.log(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
