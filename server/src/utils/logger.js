/**
 * Structured Logger Utility
 */
const LogLevels = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? (typeof meta === 'object' ? ` ${JSON.stringify(meta)}` : ` ${meta}`) : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

const logger = {
  info: (message, meta) => {
    console.log(formatMessage(LogLevels.INFO, message, meta));
  },
  warn: (message, meta) => {
    console.warn(formatMessage(LogLevels.WARN, message, meta));
  },
  error: (message, meta) => {
    console.error(formatMessage(LogLevels.ERROR, message, meta));
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage(LogLevels.DEBUG, message, meta));
    }
  }
};

module.exports = logger;
