// CommonJS preload — runs before tsx ESM loader, sets env vars from .env
// Explicitly resolve .env from the project root (one level up from /server)
const path = require('path');
require('dotenv').config({ 
  path: path.resolve(__dirname, '..', '.env'),
  quiet: true  // Suppress dotenvx logs
});
