import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { z } from "zod";
import { createAuthRouter } from "./auth.js";
import { prisma } from "./db.js";
import { createPublicRouter, publicApiErrorHandler } from "./public-api.js";
import { createAdminRouter, adminApiErrorHandler } from "./admin-api.js";
import { startEmailOutboxWorker } from "./email-outbox.js";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  FRONTEND_ORIGIN: z.string().url(),
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
  SESSION_COOKIE_NAME: z.string().min(1).default("ms_admin_session"),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(12).default(8),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("lax"),
});

const env = envSchema.parse(process.env);
if (env.COOKIE_SAME_SITE === "none" && env.COOKIE_SECURE !== "true") throw new Error("COOKIE_SAME_SITE=none requires COOKIE_SECURE=true.");
if (env.NODE_ENV === "production" && env.COOKIE_SECURE !== "true") throw new Error("COOKIE_SECURE=true is required in production.");
const frontendOrigin = new URL(env.FRONTEND_ORIGIN).origin;
const app = express();
app.disable("x-powered-by");
if (env.TRUSTED_PROXY_HOPS > 0) app.set("trust proxy", env.TRUSTED_PROXY_HOPS);
app.use(helmet());
app.use(cors({
  origin: frontendOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "X-Turnstile-Token", "X-CSRF-Token"],
  maxAge: 600,
}));
app.use("/api", (request, response, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && request.get("origin") !== frontendOrigin) {
    return response.status(403).json({ error: "Request origin is not allowed." });
  }
  return next();
});
app.use(express.json({ limit: "32kb", strict: true }));
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait and try again." },
});

app.get("/health", (_request, response) => response.status(200).json({ status: "ok" }));
app.get("/ready", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return response.status(200).json({ status: "ready", database: "connected" });
  } catch {
    return response.status(503).json({ status: "not_ready", database: "unavailable" });
  }
});
app.use("/api", apiLimiter);
const authConfig = {
  cookieName: env.SESSION_COOKIE_NAME,
  sessionTtlHours: env.SESSION_TTL_HOURS,
  secureCookie: env.COOKIE_SECURE === "true",
  sameSite: env.COOKIE_SAME_SITE,
};
const authRouter = await createAuthRouter(authConfig);
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Unable to sign in right now. Try again later." },
});
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/public", createPublicRouter({ secureCookie: env.COOKIE_SECURE === "true", sameSite: env.COOKIE_SAME_SITE }));
app.use("/api/admin", createAdminRouter(authConfig));
app.use("/api/admin", adminApiErrorHandler);
app.use("/api", (_request, response) => response.status(404).json({ error: "Route not found" }));

app.use((error: unknown, request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof SyntaxError) return response.status(400).json({ error: "Invalid request body" });
  if (request.path.startsWith("/api/public/")) return publicApiErrorHandler(error, request, response);
  console.error("Unhandled request error");
  return response.status(500).json({ error: "An unexpected error occurred" });
});

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.info(`Mindsupport API listening on port ${env.PORT}`);
});
startEmailOutboxWorker();

async function shutdown(signal: string) {
  console.info(`Received ${signal}; closing API connections.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
