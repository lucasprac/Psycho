-- Script para resetar o banco de dados

-- Desativar restrições de chave estrangeira temporariamente
ALTER TABLE "patients" DISABLE TRIGGER ALL;
ALTER TABLE "sessions" DISABLE TRIGGER ALL;
ALTER TABLE "activities" DISABLE TRIGGER ALL;
ALTER TABLE "scale_responses" DISABLE TRIGGER ALL;
ALTER TABLE "scale_assignments" DISABLE TRIGGER ALL;
ALTER TABLE "notifications" DISABLE TRIGGER ALL;
ALTER TABLE "scales" DISABLE TRIGGER ALL;
ALTER TABLE "psychologists" DISABLE TRIGGER ALL;
ALTER TABLE "users" DISABLE TRIGGER ALL;

-- Limpar tabelas
TRUNCATE TABLE "patients" CASCADE;
TRUNCATE TABLE "sessions" CASCADE;
TRUNCATE TABLE "activities" CASCADE;
TRUNCATE TABLE "scale_responses" CASCADE;
TRUNCATE TABLE "scale_assignments" CASCADE;
TRUNCATE TABLE "notifications" CASCADE;
TRUNCATE TABLE "scales" CASCADE;
TRUNCATE TABLE "psychologists" CASCADE;
TRUNCATE TABLE "users" CASCADE;

-- Reativar restrições de chave estrangeira
ALTER TABLE "patients" ENABLE TRIGGER ALL;
ALTER TABLE "sessions" ENABLE TRIGGER ALL;
ALTER TABLE "activities" ENABLE TRIGGER ALL;
ALTER TABLE "scale_responses" ENABLE TRIGGER ALL;
ALTER TABLE "scale_assignments" ENABLE TRIGGER ALL;
ALTER TABLE "notifications" ENABLE TRIGGER ALL;
ALTER TABLE "scales" ENABLE TRIGGER ALL;
ALTER TABLE "psychologists" ENABLE TRIGGER ALL;
ALTER TABLE "users" ENABLE TRIGGER ALL;

-- Criar tabelas se não existirem
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "password" VARCHAR(255),
  "user_type" VARCHAR(20) NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "psychologists" (
  "id" UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "crp" VARCHAR(20),
  "specialty" VARCHAR(100),
  "bio" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "patients" (
  "id" UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "psychologist_id" UUID REFERENCES "psychologists"("id") ON DELETE SET NULL,
  "date_of_birth" DATE,
  "phone" VARCHAR(20),
  "emergency_contact" VARCHAR(100),
  "notes" TEXT,
  "status" VARCHAR(20) DEFAULT 'active',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "psychologist_id" UUID REFERENCES "psychologists"("id") ON DELETE CASCADE,
  "patient_id" UUID REFERENCES "patients"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "time" TIME NOT NULL,
  "duration" INTEGER NOT NULL,
  "notes" TEXT,
  "status" VARCHAR(20) DEFAULT 'scheduled',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "scales" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "questions" JSONB NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "scale_assignments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "psychologist_id" UUID REFERENCES "psychologists"("id") ON DELETE CASCADE,
  "patient_id" UUID REFERENCES "patients"("id") ON DELETE CASCADE,
  "scale_id" UUID REFERENCES "scales"("id") ON DELETE CASCADE,
  "status" VARCHAR(20) DEFAULT 'pending',
  "due_date" DATE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "scale_responses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "assignment_id" UUID REFERENCES "scale_assignments"("id") ON DELETE CASCADE,
  "psychologist_id" UUID REFERENCES "psychologists"("id") ON DELETE CASCADE,
  "patient_id" UUID REFERENCES "patients"("id") ON DELETE CASCADE,
  "scale_id" UUID REFERENCES "scales"("id") ON DELETE CASCADE,
  "responses" JSONB NOT NULL,
  "score" INTEGER,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "activities" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "psychologist_id" UUID REFERENCES "psychologists"("id") ON DELETE CASCADE,
  "patient_id" UUID REFERENCES "patients"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "due_date" DATE,
  "status" VARCHAR(20) DEFAULT 'scheduled',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "recipient_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "type" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "link" VARCHAR(255),
  "read" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS "idx_patients_psychologist" ON "patients"("psychologist_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_psychologist" ON "sessions"("psychologist_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_patient" ON "sessions"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_activities_psychologist" ON "activities"("psychologist_id");
CREATE INDEX IF NOT EXISTS "idx_activities_patient" ON "activities"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_scale_assignments_patient" ON "scale_assignments"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_scale_responses_patient" ON "scale_responses"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_recipient" ON "notifications"("recipient_id");
