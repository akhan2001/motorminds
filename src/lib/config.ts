// Environment configuration utility
export const config = {
  // App URLs
  app: {
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.motorminds.ca',
  },

  // DocuSeal configuration
  docuseal: {
    apiUrl: process.env.DOCUSEAL_API_URL || 'https://api.docuseal.com',
    baseUrl: process.env.NEXT_PUBLIC_DOCUSEAL_URL || 'https://docuseal.com',
    apiKey: process.env.DOCUSEAL_API_KEY,
    // For free plan users, you need to create a template manually and set this ID
    templateId: process.env.DOCUSEAL_TEMPLATE_ID || process.env.DOCUSEAL_FREE_TEMPLATE_ID,
  },

  // Email configuration
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    fromDomain: process.env.EMAIL_FROM_DOMAIN || 'motorminds.ca',
  },

  // Environment helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
}; 