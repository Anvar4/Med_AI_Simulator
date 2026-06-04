// Side-effect module: loads .env as early as possible. Import this FIRST in
// the entry point so that any module reading process.env at import time sees
// the configured values (e.g. storageService, payment signatures).
import dotenv from 'dotenv'
dotenv.config()
