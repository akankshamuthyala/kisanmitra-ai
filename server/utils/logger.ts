import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'password_hash',
      'current_password',
      'new_password',
      'GEMINI_API_KEY',
      '*.password',
      '*.token',
    ],
    remove: true,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
