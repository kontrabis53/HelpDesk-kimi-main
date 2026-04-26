-- AlterTable
ALTER TABLE "User" ADD COLUMN     "greetingText" TEXT NOT NULL DEFAULT 'Шо ты маленький, привет',
ADD COLUMN     "showGreeting" BOOLEAN NOT NULL DEFAULT true;
