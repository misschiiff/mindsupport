import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "./db.js";

const scrypt = promisify(scryptCallback);

export type AuthConfig = {
  cookieName: string;
  secureCookie: boolean;
  sameSite: "strict" | "lax" | "none";
  sessionTtlHours: number;
};

export type StaffPrincipal = { id: string; email: string; role: string };
declare global {
  namespace Express {
    interface Request { staff?: StaffPrincipal }
  }
}

const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{14,128}$/;

export function validatePassword(password: string) {
  return passwordPolicy.test(password);
}

export async function hashPassword(password: string) {
  if (!validatePassword(password)) throw new Error("Password does not meet policy");
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltHex, keyHex, extra] = encoded.split("$");
  if (algorithm !== "scrypt" || !saltHex || !keyHex || extra !== undefined || !/^[\da-f]{32}$/i.test(saltHex) || !/^[\da-f]{128}$/i.test(keyHex)) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length) as Buffer;
  return timingSafeEqual(expected, actual);
}

function cookieOptions(config: AuthConfig, expires?: Date) {
  return {
    httpOnly: true,
    secure: config.secureCookie,
    sameSite: config.sameSite,
    path: "/api",
    ...(expires ? { expires } : {}),
  };
}

export function clearSessionCookie(response: Response, config: AuthConfig) {
  response.clearCookie(config.cookieName, cookieOptions(config));
}

function digestToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAuthRouter(config: AuthConfig) {
  const router = Router();
  const dummyPasswordHash = await hashPassword("UnavailableAccountDummy!2026");

  router.post("/login", async (request, response) => {
    const rawEmail = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
    const email = rawEmail.length <= 254 ? rawEmail : "";
    const password = typeof request.body?.password === "string" ? request.body.password : "";
    const now = Date.now();

    const user = email ? await prisma.adminUser.findUnique({ where: { email } }) : null;
    const passwordMatches = await verifyPassword(password.length <= 128 ? password : "invalid-password-length", user?.passwordHash ?? dummyPasswordHash);
    const valid = Boolean(user?.active && (!user.lockedUntil || user.lockedUntil.getTime() <= now) && passwordMatches);
    if (!valid || !user) {
      if (user) {
        const updated = await prisma.adminUser.update({ where: { id: user.id }, data: { failedLoginCount: { increment: 1 } }, select: { failedLoginCount: true } });
        const failedLoginCount = updated.failedLoginCount;
        if (failedLoginCount >= 8) await prisma.adminUser.update({ where: { id: user.id }, data: { lockedUntil: new Date(now + 15 * 60_000) } });
      }
      return response.status(401).json({ error: "Email or password is incorrect." });
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(now + config.sessionTtlHours * 60 * 60_000);
    await prisma.$transaction([
      prisma.adminSession.create({ data: { userId: user.id, tokenHash: digestToken(token), expiresAt } }),
      prisma.adminUser.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date(now) } }),
      prisma.auditEvent.create({ data: { actorId: user.id, action: "staff.login", entityType: "admin_session" } }),
    ]);
    response.cookie(config.cookieName, token, { ...cookieOptions(config, expiresAt), maxAge: config.sessionTtlHours * 60 * 60_000 });
    return response.status(200).json({ staff: { id: user.id, email: user.email, role: user.role }, expiresAt: expiresAt.toISOString() });
  });

  router.post("/logout", async (request, response) => {
    const token = request.cookies?.[config.cookieName];
    if (typeof token === "string" && token.length >= 40) {
      const tokenHash = digestToken(token);
      const session = await prisma.adminSession.findUnique({ where: { tokenHash }, select: { id: true, userId: true } });
      if (session) {
        await prisma.$transaction([
          prisma.adminSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } }),
          prisma.auditEvent.create({ data: { actorId: session.userId, action: "staff.logout", entityType: "admin_session", entityId: session.id } }),
        ]);
      }
    }
    clearSessionCookie(response, config);
    return response.status(204).end();
  });

  router.get("/me", requireStaff(config), (request, response) => response.json({ staff: request.staff }));
  return router;
}

export function requireStaff(config: AuthConfig) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      const token = request.cookies?.[config.cookieName];
      if (typeof token !== "string" || token.length < 40 || token.length > 64) return response.status(401).json({ error: "Authentication required." });
      const session = await prisma.adminSession.findUnique({
        where: { tokenHash: digestToken(token) },
        select: { id: true, expiresAt: true, revokedAt: true, user: { select: { id: true, email: true, role: true, active: true } } },
      });
      if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.active) return response.status(401).json({ error: "Authentication required." });
      request.staff = { id: session.user.id, email: session.user.email, role: session.user.role };
      return next();
    } catch {
      return response.status(503).json({ error: "Authentication service temporarily unavailable." });
    }
  };
}

export function requireRole(...roles: string[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.staff) return response.status(401).json({ error: "Authentication required." });
    if (!roles.includes(request.staff.role)) return response.status(403).json({ error: "You do not have access to this resource." });
    return next();
  };
}

