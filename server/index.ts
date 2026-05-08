import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import leadsRouter from './routes/leads';
import auditsRouter from './routes/audits';
import ogRouter from './routes/og';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Env validation ────────────────────────────────────────────────────────────
function checkEnv() {
  const vars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'RESEND_API_KEY',
    'APP_URL',
    'PORT',
  ];

  console.log('[env] Checking environment variables:');
  let allSet = true;
  for (const key of vars) {
    const val = process.env[key];
    if (val) {
      // Show only first 8 chars for security
      console.log(`  ✅ ${key} = ${val.slice(0, 8)}...`);
    } else {
      console.warn(`  ⚠️  ${key} is NOT set`);
      allSet = false;
    }
  }
  if (allSet) {
    console.log('[env] All variables loaded.\n');
  } else {
    console.warn('[env] Some variables are missing — check your .env file.\n');
  }
}

checkEnv();

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.APP_URL ?? 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log but still allow — CORS preflight will pass, actual request may fail
      console.log(`[cors] Request from ${origin}`);
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json());

// Rate limiting — 10 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api', limiter);
app.use('/api/leads', leadsRouter);
app.use('/api/audits', auditsRouter);

// OG route — no rate limit, crawlers need free access
app.use('/og/share', ogRouter);

// ── Anthropic proxy (optional) ────────────────────────────────────────────────
// If you call Anthropic from the backend, use this helper to catch credit errors.
export function handleAnthropicError(err: unknown, res: express.Response) {
  const message =
    err instanceof Error ? err.message : String(err);

  if (message.includes('credit balance is too low')) {
    return res.status(402).json({
      error: 'ai_credits_exhausted',
      message:
        'The AI analysis service is temporarily unavailable due to insufficient credits. Please try again later.',
    });
  }

  console.error('[anthropic] Unexpected error:', message);
  return res.status(500).json({ error: 'Internal server error' });
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
});

export default app;
