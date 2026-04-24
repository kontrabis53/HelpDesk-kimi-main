import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = (globalThis as any).prisma ?? prismaClientSingleton();

export default prisma as PrismaClient;

if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = prisma;
