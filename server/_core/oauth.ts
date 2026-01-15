/**
 * Authentication Routes
 * Handles local authentication (register, login, logout)
 */

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { authService } from "./auth";
import { getSessionCookieOptions } from "./cookies";

export function registerOAuthRoutes(app: Express) {
  /**
   * POST /api/auth/register
   * Register a new user with email/password
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const user = await authService.registerUser(
        email,
        password,
        name || email.split("@")[0]
      );

      const sessionToken = await authService.createSessionToken(user, {
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[Auth] Registration failed", error);
      const message = error instanceof Error ? error.message : "Registration failed";
      res.status(400).json({ error: message });
    }
  });

  /**
   * POST /api/auth/login
   * Login with email/password
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const user = await authService.loginWithPassword(email, password);

      const sessionToken = await authService.createSessionToken(user, {
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(401).json({ error: "Invalid email or password" });
    }
  });

  /**
   * POST /api/auth/logout
   * Clear session cookie
   */
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.status(200).json({ success: true });
  });

  /**
   * GET /api/auth/me
   * Get current authenticated user (for compatibility)
   */
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await authService.authenticateRequest(req);
      res.status(200).json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } catch {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
}
