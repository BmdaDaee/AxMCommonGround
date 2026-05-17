import { createApp } from './app.js';
import { env } from './config/env.js';

try {
  console.log('[CommonGround] Starting server...');
  
  const app = createApp();
  
  const port = env.port || 3001;
  app.listen(port, () => {
    console.log(`[CommonGround] Server listening on port ${port}`);
  });
  
  // Unhandled error handlers
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[CommonGround] Unhandled Rejection:', reason);
  });
  
  process.on('uncaughtException', (error) => {
    console.error('[CommonGround] Uncaught Exception:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('[CommonGround] Failed to start server:', error);
  process.exit(1);
}
