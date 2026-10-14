import { createHmac, randomBytes } from "crypto";
import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET ?? "examforge-secret-key-change-me";

function base64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function createToken(payload: object): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 }));
  const sig = base64url(createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = base64url(createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest());
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = createHmac("sha256", salt).update(password).digest("hex");
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  const computed = createHmac("sha256", salt).update(password).digest("hex");
  return computed === hash;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ success: false, status: 401, message: "Unauthorized", timestamp: new Date().toISOString() });
    return;
  }
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ success: false, status: 401, message: "Invalid or expired token", timestamp: new Date().toISOString() });
    return;
  }
  (req as Request & { user: Record<string, unknown> }).user = payload;
  next();
}

export async function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: Record<string, unknown> }).user;
    if (!user || user.role !== role) {
      res.status(403).json({ success: false, status: 403, message: "Forbidden", timestamp: new Date().toISOString() });
      return;
    }
    next();
  };
}

export function getCurrentUser(req: Request): { id: number; email: string; role: string } | null {
  const u = (req as Request & { user?: Record<string, unknown> }).user;
  if (!u) return null;
  return { id: Number(u.userId), email: String(u.email), role: String(u.role) };
}
