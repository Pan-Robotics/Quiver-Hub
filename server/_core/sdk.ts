/**
 * SDK Server - Authentication utilities
 * Re-exports auth service for backward compatibility with existing code
 */

import { authService } from "./auth";

// Re-export auth service as sdk for backward compatibility
export const sdk = {
  authenticateRequest: authService.authenticateRequest.bind(authService),
  createSessionToken: authService.createSessionToken.bind(authService),
  verifySession: authService.verifySession.bind(authService),
};
