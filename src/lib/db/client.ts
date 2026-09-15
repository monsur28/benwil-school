import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure sslmode=verify-full is used to satisfy pg/pg-connection-string security requirements
function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL
  if (!url) return undefined
  return url.replace(/([?&])sslmode=require(&|$)/, "$1sslmode=verify-full$2")
}

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() })

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
