// Environment configuration utility
export const config = {
  // App URLs
  app: {
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 
             (process.env.NODE_ENV === 'production' 
              ? 'https://app.motorminds.ca' 
              : 'http://localhost:3000'),
  },

  // DocuSeal configuration
  docuseal: {
    apiUrl: process.env.DOCUSEAL_API_URL || 'https://api.docuseal.com',
    baseUrl: process.env.NEXT_PUBLIC_DOCUSEAL_URL || 'https://docuseal.com',
    apiKey: process.env.DOCUSEAL_API_KEY,
    templateId: process.env.DOCUSEAL_TEMPLATE_ID, // Optional - templates created dynamically
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