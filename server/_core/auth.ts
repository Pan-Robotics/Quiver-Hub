/**
 * Generic JWT Authentication Service
 * Platform-independent auth for self-hosted deployments
 */

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  id: string;
  openId: string;
  name: string;
};

class AuthService {
  private getSessionSecret() {
    const secret = ENV.jwtSecret;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is required");
    }
    return new TextEncoder().encode(secret);
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  /**
   * Create a session token for a user
   */
  async createSessionToken(
    user: { id: number; openId: string; name: string | null },
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      id: user.id.toString(),
      openId: user.openId,
      name: user.name || "",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  /**
   * Verify a session token and return payload
   */
  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) {
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { id, openId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        id: String(id || ""),
        openId,
        name: String(name || ""),
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Authenticate a request and return the user
   */
  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid or missing session");
    }

    const user = await db.getUserByOpenId(session.openId);

    if (!user) {
      throw ForbiddenError("User not found");
    }

    // Update last signed in
    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: new Date(),
    });

    return user;
  }

  /**
   * Register a new user with email/password
   */
  async registerUser(
    email: string,
    password: string,
    name: string
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password (simple hash for demo - use bcrypt in production)
    const passwordHash = await this.hashPassword(password);
    const openId = `local_${nanoid(16)}`;

    await db.upsertUser({
      openId,
      email,
      name,
      loginMethod: "local",
      passwordHash,
      lastSignedIn: new Date(),
    });

    const user = await db.getUserByOpenId(openId);
    if (!user) {
      throw new Error("Failed to create user");
    }

    return user;
  }

  /**
   * Authenticate user with email/password
   */
  async loginWithPassword(email: string, password: string): Promise<User> {
    const user = await db.getUserByEmail(email);
    if (!user) {
      throw ForbiddenError("Invalid email or password");
    }

    if (!user.passwordHash) {
      throw ForbiddenError("Password login not enabled for this account");
    }

    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw ForbiddenError("Invalid email or password");
    }

    // Update last signed in
    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: new Date(),
    });

    return user;
  }

  /**
   * Simple password hashing (use bcrypt in production)
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + ENV.jwtSecret);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    const computedHash = await this.hashPassword(password);
    return computedHash === hash;
  }

  /**
   * Create admin user if none exists (for initial setup)
   */
  async ensureAdminUser(): Promise<void> {
    const adminEmail = ENV.adminEmail;
    const adminPassword = ENV.adminPassword;

    if (!adminEmail || !adminPassword) {
      console.log("[Auth] No admin credentials configured, skipping admin setup");
      return;
    }

    const existingAdmin = await db.getUserByEmail(adminEmail);
    if (existingAdmin) {
      console.log("[Auth] Admin user already exists");
      return;
    }

    console.log("[Auth] Creating admin user...");
    const passwordHash = await this.hashPassword(adminPassword);
    const openId = `admin_${nanoid(16)}`;

    await db.upsertUser({
      openId,
      email: adminEmail,
      name: "Admin",
      loginMethod: "local",
      passwordHash,
      role: "admin",
      lastSignedIn: new Date(),
    });

    console.log("[Auth] Admin user created successfully");
  }
}

export const authService = new AuthService();
