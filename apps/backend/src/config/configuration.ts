const resolveNodeEnv = () => process.env.NODE_ENV?.trim() || 'development';

const resolveBaseUrl = () => {
  const nodeEnv = resolveNodeEnv();
  const sharedBase = process.env.APP_BASE_URL;
  const devBase = process.env.APP_BASE_URL_DEV;
  const prodBase = process.env.APP_BASE_URL_PROD;
  const fallbackBase = 'http://localhost:3000';
  const isDevLike = nodeEnv === 'development' || nodeEnv === 'test';
  console.log(nodeEnv, 'nodeEnv')
  if (isDevLike) {
    return devBase || sharedBase || fallbackBase;
  }

  return prodBase || sharedBase || fallbackBase;
};

export default () => ({
  app: {
    port: parseInt(process.env.APP_PORT) || 3000,
    nodeEnv: resolveNodeEnv(),
    baseUrl: resolveBaseUrl(),
  },
  file: {
    maxSizeMB: parseInt(process.env.FILE_MAX_SIZE_MB) || 10,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'yourSecretKey',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  mongodb: {
    host: process.env.MONGODB_HOST || '127.0.0.1',
    port: parseInt(process.env.MONGODB_PORT) || 27017,
    database: process.env.MONGODB_DB || 'test',
    user: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PASS || '',
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    database: parseInt(process.env.REDIS_DB) || 0,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
  },
  ai: {
    baseUrl:
      process.env.AI_API_BASE_URL ||
      'https://generativelanguage.googleapis.com',
    apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
    model:
      process.env.AI_MODEL || process.env.OPENAI_MODEL || 'gemini-1.5-flash',
    imageModel: process.env.AI_IMAGE_MODEL || 'gemini-2.5-flash-image',
    timeoutMs: parseInt(process.env.AI_API_TIMEOUT_MS) || 20000,
  },
});
