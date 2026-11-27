-- Convert the initial flexible role field to an allow-listed database enum.
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'STAFF');

ALTER TABLE "AdminUser"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "StaffRole" USING "role"::"StaffRole",
  ALTER COLUMN "role" SET DEFAULT 'ADMIN';
