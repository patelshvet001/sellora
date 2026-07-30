require('dotenv').config();

const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(
    `Missing required environment variable(s): ${missing.join(', ')}.\n` +
    `Copy .env.example to .env and fill these in before starting the server.`
  );
  process.exit(1);
}

const app = require('./src/app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Sellora API running on http://localhost:${PORT}`);
});
