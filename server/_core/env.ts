/**
 * Environment Variables
 * Platform-independent configuration
 */

export const ENV = {
  // Application
  appName: process.env.APP_NAME ?? "Quiver Hub",
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT ?? "3000", 10),

  // Database
  databaseUrl: process.env.DATABASE_URL ?? "",

  // Authentication
  jwtSecret: process.env.JWT_SECRET ?? "",

  // Admin user (optional - for initial setup)
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",

  // Feature flags
  allowRegistration: process.env.ALLOW_REGISTRATION !== "false",
};
