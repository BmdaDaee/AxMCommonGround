#!/usr/bin/env node

// CommonGround API Server
// This file requires the TypeScript-compiled tRPC backend

try {
  console.log('[CommonGround] Starting API server...');
  
  // Try to load the compiled TypeScript server
  // If TypeScript compilation fails, fall back to simple test server
  let app;
  
  try {
    // Try to load the compiled tRPC backend
    const { createApp } = require('./packages/server/dist/app.js');
    app = createApp();
    console.log('[CommonGround] Loaded tRPC backend');
  } catch (tsError) {
    console.warn('[CommonGround] TypeScript backend not available, using fallback server');
    console.error(tsError.message);
    
    // Fallback: simple Express server
    const express = require('express');
    const cors = require('cors');
    
    app = express();
    app.use(cors());
    app.use(express.json());
    
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString(), mode: 'fallback' });
    });
    
    app.get('/api/test', (req, res) => {
      res.json({ message: 'CommonGround API is running (fallback mode)' });
    });
  }
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`[CommonGround] API listening on port ${PORT}`);
  });
  
  // Error handlers
  process.on('unhandledRejection', (reason) => {
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
