import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword, validatePassword } from "./auth.js";

const prisma = new PrismaClient();
try {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Set a valid ADMIN_BOOTSTRAP_EMAIL in the private environment before creating the account.");
  if (!validatePassword(password)) throw new Error("ADMIN_BOOTSTRAP_PASSWORD must be 14-128 characters and include lowercase, uppercase, number, and symbol.");
  const existing = await prisma.adminUser.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new Error("That staff email already exists; use the password reset process instead of rerunning bootstrap.");
  const passwordHash = await hashPassword(password);
  const admin = await prisma.$transaction(async (transaction) => {
    const created = await transaction.adminUser.create({ data: { email, passwordHash, role: "ADMIN" }, select: { id: true, email: true, role: true } });
    await transaction.auditEvent.create({ data: { actorId: created.id, action: "staff.created", entityType: "admin_user", entityId: created.id } });
    return created;
  });
  console.info(`Created staff account ${admin.email} (${admin.role}).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Could not create staff account.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
