import type { Request } from "express";
import { isIP } from "node:net";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

export function clientKey(req: Request, onVercel: boolean) {
  // Vercel overwrites this header at its public edge; other hosts must use the socket IP.
  const forwarded = onVercel ? req.get("x-vercel-forwarded-for")?.trim() : undefined;
  const ip = forwarded && isIP(forwarded) ? forwarded : req.ip || "unknown";
  return ipKeyGenerator(ip);
}

export function createInjectiveLimiter(onVercel: boolean) {
  return rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => clientKey(req, onVercel),
    message: { error: "Too many Injective requests. Retry after the indicated delay." },
  });
}
