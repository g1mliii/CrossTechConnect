export const appConfig = {
  development: {
    port: parseInt(process.env.PORT || '3000'),
    host: 'localhost',
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
    },
    logging: {
      level: 'debug',
      format: 'dev',
    },
  },
  staging: {
    port: parseInt(process.env.PORT || '3000'),
    host: '0.0.0.0',
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // limit each IP to 500 requests per windowMs
    },
    logging: {
      level: 'info',
      format: 'combined',
    },
  },
  production: {
    port: parseInt(process.env.PORT || '3000'),
    host: '0.0.0.0',
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
    logging: {
      level: 'warn',
      format: 'combined',
    },
  },
};

export const aiConfig = {
  development: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      maxTokens: 4000,
    },
    localLLM: {
      url: process.env.LOCAL_LLM_URL || 'http://localhost:11434',
      model: 'llama2',
      timeout: 30000,
    },
  },
  staging: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      maxTokens: 4000,
    },
    localLLM: {
      url: process.env.LOCAL_LLM_URL,
      model: 'llama2',
      timeout: 30000,
    },
  },
  production: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      maxTokens: 4000,
    },
    localLLM: {
      url: process.env.LOCAL_LLM_URL,
      model: 'llama2',
      timeout: 30000,
    },
  },
};

export const getCurrentAppConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return {
    app: appConfig[env as keyof typeof appConfig],
    ai: aiConfig[env as keyof typeof aiConfig],
  };
};