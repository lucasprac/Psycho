-- Verificar e criar tabela de atividades se não existir
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  psychologist_id UUID NOT NULL REFERENCES psychologists(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration INTEGER,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar e criar tabela de respostas de escalas se não existir
CREATE TABLE IF NOT EXISTS scale_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scale_id UUID NOT NULL REFERENCES scales(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  psychologist_id UUID NOT NULL REFERENCES psychologists(id),
  responses JSONB NOT NULL,
  score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar e criar tabela de atribuições de escalas se não existir
CREATE TABLE IF NOT EXISTS scale_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scale_id UUID NOT NULL REFERENCES scales(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  psychologist_id UUID NOT NULL REFERENCES psychologists(id),
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar e criar tabela de notificações se não existir
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES users(id),
  sender_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('scale', 'activity', 'thought', 'session', 'patient')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campo time à tabela sessions se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'time'
  ) THEN
    ALTER TABLE sessions ADD COLUMN time TIME;
  END IF;
END $$;
