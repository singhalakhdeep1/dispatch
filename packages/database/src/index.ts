import { PrismaClient } from "@prisma/client";

// Singleton pattern — one connection per process
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "info", "warn", "error"]
                : ["warn", "error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Re-export everything from the generated client
export * from "@prisma/client";
export { PrismaClient };
