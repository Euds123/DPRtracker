-- ============================================================
-- DPR Tracker – Full schema for Neon PostgreSQL
-- Run in Neon Console → SQL Editor (database: neondb)
-- WARNING: DROP section deletes existing employees/dpr data
-- ============================================================

-- ---------- 1. Clean up old objects (if re-running) ----------
DROP TABLE IF EXISTS "dpr_entries" CASCADE;
DROP TABLE IF EXISTS "employees" CASCADE;
DROP TYPE IF EXISTS "DprStatus" CASCADE;

-- ---------- 2. Enum: DPR status ----------
CREATE TYPE "DprStatus" AS ENUM (
  'NA',
  'Filled',
  'Not Filled',
  'Holiday',
  'Comp Off'
);

-- ---------- 3. Table: employees ----------
CREATE TABLE "employees" (
  "id"            SERIAL PRIMARY KEY,
  "employee_name" TEXT NOT NULL,
  "employee_id"   TEXT NOT NULL,
  "email"         TEXT NOT NULL,
  "joining_date"  DATE NOT NULL,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "employees_employee_id_key" ON "employees" ("employee_id");
CREATE INDEX "employees_employee_name_idx" ON "employees" ("employee_name");
CREATE INDEX "employees_joining_date_idx" ON "employees" ("joining_date");

-- ---------- 4. Table: dpr_entries ----------
CREATE TABLE "dpr_entries" (
  "id"          SERIAL PRIMARY KEY,
  "employee_id" INTEGER NOT NULL,
  "dpr_date"    DATE NOT NULL,
  "status"      "DprStatus" NOT NULL DEFAULT 'NA',
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dpr_entries_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "dpr_entries_employee_id_dpr_date_key"
  ON "dpr_entries" ("employee_id", "dpr_date");
CREATE INDEX "dpr_entries_dpr_date_idx" ON "dpr_entries" ("dpr_date");
CREATE INDEX "dpr_entries_status_idx" ON "dpr_entries" ("status");

-- ---------- 5. Auto-update updated_at on row change ----------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON "employees"
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER dpr_entries_updated_at
  BEFORE UPDATE ON "dpr_entries"
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ---------- 6. Optional sample data ----------
INSERT INTO "employees" ("employee_name", "employee_id", "email", "joining_date") VALUES
  ('Rahul Sharma',  'EMP001', 'rahul.sharma@company.com',  '2024-01-15'),
  ('Priya Patel',   'EMP002', 'priya.patel@company.com',   '2024-06-01'),
  ('Amit Kumar',    'EMP003', 'amit.kumar@company.com',    '2025-03-10'),
  ('Sneha Reddy',   'EMP004', 'sneha.reddy@company.com',   '2025-11-20'),
  ('Vikram Singh',  'EMP005', 'vikram.singh@company.com',  '2026-05-01');

INSERT INTO "dpr_entries" ("employee_id", "dpr_date", "status") VALUES
  (1, '2026-05-01', 'Filled'),
  (1, '2026-05-02', 'Filled'),
  (1, '2026-05-03', 'Not Filled'),
  (2, '2026-05-01', 'Holiday'),
  (2, '2026-05-02', 'Filled');
