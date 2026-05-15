-- CreateEnum
CREATE TYPE "DprStatus" AS ENUM ('NA', 'Filled', 'Not Filled', 'Holiday', 'Comp Off');

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "employee_name" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "joining_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dpr_entries" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "dpr_date" DATE NOT NULL,
    "status" "DprStatus" NOT NULL DEFAULT 'NA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dpr_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_id_key" ON "employees"("employee_id");

-- CreateIndex
CREATE INDEX "employees_employee_name_idx" ON "employees"("employee_name");

-- CreateIndex
CREATE INDEX "employees_joining_date_idx" ON "employees"("joining_date");

-- CreateIndex
CREATE UNIQUE INDEX "dpr_entries_employee_id_dpr_date_key" ON "dpr_entries"("employee_id", "dpr_date");

-- CreateIndex
CREATE INDEX "dpr_entries_dpr_date_idx" ON "dpr_entries"("dpr_date");

-- CreateIndex
CREATE INDEX "dpr_entries_status_idx" ON "dpr_entries"("status");

-- AddForeignKey
ALTER TABLE "dpr_entries" ADD CONSTRAINT "dpr_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
