-- Tabela para armazenar as respostas de escalas
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

-- Tabela para armazenar as atribuições de escalas
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

-- Tabela para armazenar as atividades
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

-- Tabela para armazenar as notificações
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

-- Função para obter estatísticas do dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_psychologist_id UUID)
RETURNS JSON AS $$
DECLARE
  total_patients INTEGER;
  new_patients INTEGER;
  completed_sessions INTEGER;
  recent_sessions INTEGER;
  applied_scales INTEGER;
  recent_scales INTEGER;
  scheduled_activities INTEGER;
  recent_activities INTEGER;
  last_month TIMESTAMP;
  last_week TIMESTAMP;
BEGIN
  -- Definir períodos
  last_month := NOW() - INTERVAL '1 month';
  last_week := NOW() - INTERVAL '1 week';

  -- Total de pacientes
  SELECT COUNT(*) INTO total_patients
  FROM patients
  WHERE psychologist_id = p_psychologist_id
  AND status = 'active';

  -- Pacientes novos no último mês
  SELECT COUNT(*) INTO new_patients
  FROM patients
  WHERE psychologist_id = p_psychologist_id
  AND status = 'active'
  AND created_at >= last_month;

  -- Sessões completadas
  SELECT COUNT(*) INTO completed_sessions
  FROM sessions
  WHERE psychologist_id = p_psychologist_id
  AND status = 'completed';

  -- Sessões completadas na última semana
  SELECT COUNT(*) INTO recent_sessions
  FROM sessions
  WHERE psychologist_id = p_psychologist_id
  AND status = 'completed'
  AND date >= last_week;

  -- Escalas aplicadas
  SELECT COUNT(*) INTO applied_scales
  FROM scale_responses
  WHERE psychologist_id = p_psychologist_id;

  -- Escalas aplicadas na última semana
  SELECT COUNT(*) INTO recent_scales
  FROM scale_responses
  WHERE psychologist_id = p_psychologist_id
  AND created_at >= last_week;

  -- Atividades agendadas
  SELECT COUNT(*) INTO scheduled_activities
  FROM activities
  WHERE psychologist_id = p_psychologist_id
  AND status = 'scheduled';

  -- Atividades agendadas no último mês
  SELECT COUNT(*) INTO recent_activities
  FROM activities
  WHERE psychologist_id = p_psychologist_id
  AND status = 'scheduled'
  AND created_at >= last_month;

  -- Retornar JSON com estatísticas
  RETURN json_build_object(
    'totalPatients', COALESCE(total_patients, 0),
    'patientsTrend', COALESCE(new_patients, 0),
    'completedSessions', COALESCE(completed_sessions, 0),
    'sessionsTrend', COALESCE(recent_sessions, 0),
    'appliedScales', COALESCE(applied_scales, 0),
    'scalesTrend', COALESCE(recent_scales, 0),
    'scheduledActivities', COALESCE(scheduled_activities, 0),
    'activitiesTrend', COALESCE(recent_activities, 0)
  );
END;
$$ LANGUAGE plpgsql;

-- Função para obter pacientes ativos com detalhes
CREATE OR REPLACE FUNCTION get_active_patients(p_psychologist_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH patient_data AS (
    SELECT
      p.id,
      p.status,
      u.name,
      (
        SELECT MAX(s.date)
        FROM sessions s
        WHERE s.patient_id = p.id
      ) AS last_session,
      (
        SELECT COUNT(*)
        FROM activities a
        WHERE a.patient_id = p.id
        AND a.status = 'scheduled'
      ) AS pending_activities,
      (
        SELECT COUNT(*)
        FROM scale_assignments sa
        WHERE sa.patient_id = p.id
        AND sa.status = 'pending'
      ) AS pending_scales
    FROM patients p
    JOIN users u ON p.id = u.id
    WHERE p.psychologist_id = p_psychologist_id
    ORDER BY p.status DESC, u.name ASC
    LIMIT 10
  )
  SELECT json_agg(
    json_build_object(
      'id', pd.id,
      'name', pd.name,
      'status', pd.status,
      'lastSession', COALESCE(to_char(pd.last_session, 'DD/MM/YYYY'), 'Nenhuma sessão'),
      'pendingActivities', COALESCE(pd.pending_activities, 0),
      'pendingScales', COALESCE(pd.pending_scales, 0)
    )
  ) INTO result
  FROM patient_data pd;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Função para obter sessões
CREATE OR REPLACE FUNCTION get_sessions(p_psychologist_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH session_data AS (
    SELECT
      s.id,
      s.patient_id,
      u.name AS patient_name,
      s.date,
      s.time,
      s.duration,
      s.status
    FROM sessions s
    JOIN patients p ON s.patient_id = p.id
    JOIN users u ON p.id = u.id
    WHERE s.psychologist_id = p_psychologist_id
    ORDER BY s.date ASC
  )
  SELECT json_agg(
    json_build_object(
      'id', sd.id,
      'patientId', sd.patient_id,
      'patientName', sd.patient_name,
      'date', sd.date,
      'time', sd.time,
      'duration', sd.duration,
      'status', sd.status
    )
  ) INTO result
  FROM session_data sd;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Função para obter dados para os gráficos
CREATE OR REPLACE FUNCTION get_chart_data(p_psychologist_id UUID, p_time_range TEXT)
RETURNS JSON AS $$
DECLARE
  start_date DATE;
  sessions_data JSON;
  scales_data JSON;
  activities_data JSON;
BEGIN
  -- Definir período
  start_date := CURRENT_DATE - (p_time_range::INTEGER || ' days')::INTERVAL;

  -- Dados de sessões
  WITH session_counts AS (
    SELECT
      date,
      status,
      COUNT(*) AS count
    FROM sessions
    WHERE psychologist_id = p_psychologist_id
    AND date >= start_date
    GROUP BY date, status
    ORDER BY date ASC
  ),
  dates AS (
    SELECT generate_series(
      start_date,
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE AS date
  ),
  session_data_complete AS (
    SELECT
      d.date,
      COALESCE(SUM(CASE WHEN sc.status = 'completed' THEN sc.count ELSE 0 END), 0) AS completed,
      COALESCE(SUM(CASE WHEN sc.status = 'cancelled' THEN sc.count ELSE 0 END), 0) AS cancelled,
      COALESCE(SUM(CASE WHEN sc.status = 'scheduled' THEN sc.count ELSE 0 END), 0) AS scheduled
    FROM dates d
    LEFT JOIN session_counts sc ON d.date = sc.date
    GROUP BY d.date
    ORDER BY d.date ASC
  )
  SELECT json_build_object(
    'labels', (SELECT json_agg(to_char(date, 'DD/MM')) FROM session_data_complete),
    'datasets', json_build_array(
      json_build_object(
        'label', 'Sessões Realizadas',
        'data', (SELECT json_agg(completed) FROM session_data_complete),
        'borderColor', 'rgb(53, 162, 235)',
        'backgroundColor', 'rgba(53, 162, 235, 0.5)'
      ),
      json_build_object(
        'label', 'Sessões Canceladas',
        'data', (SELECT json_agg(cancelled) FROM session_data_complete),
        'borderColor', 'rgb(255, 99, 132)',
        'backgroundColor', 'rgba(255, 99, 132, 0.5)'
      ),
      json_build_object(
        'label', 'Sessões Agendadas',
        'data', (SELECT json_agg(scheduled) FROM session_data_complete),
        'borderColor', 'rgb(75, 192, 192)',
        'backgroundColor', 'rgba(75, 192, 192, 0.5)'
      )
    )
  ) INTO sessions_data;

  -- Dados de escalas
  WITH scale_counts AS (
    SELECT
      s.name,
      COUNT(*) AS count
    FROM scale_responses sr
    JOIN scales s ON sr.scale_id = s.id
    WHERE sr.psychologist_id = p_psychologist_id
    AND sr.created_at >= start_date
    GROUP BY s.name
    ORDER BY count DESC
  )
  SELECT json_build_object(
    'labels', (SELECT json_agg(name) FROM scale_counts),
    'datasets', json_build_array(
      json_build_object(
        'label', 'Escalas Aplicadas',
        'data', (SELECT json_agg(count) FROM scale_counts),
        'backgroundColor', json_build_array(
          'rgba(53, 162, 235, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)'
        )
      )
    )
  ) INTO scales_data;

  -- Dados de atividades
  WITH activity_counts AS (
    SELECT
      DATE(created_at) AS date,
      status,
      COUNT(*) AS count
    FROM activities
    WHERE psychologist_id = p_psychologist_id
    AND created_at >= start_date
    GROUP BY DATE(created_at), status
    ORDER BY date ASC
  ),
  dates AS (
    SELECT generate_series(
      start_date,
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE AS date
  ),
  activity_data_complete AS (
    SELECT
      d.date,
      COALESCE(SUM(CASE WHEN ac.status = 'completed' THEN ac.count ELSE 0 END), 0) AS completed,
      COALESCE(SUM(CASE WHEN ac.status = 'scheduled' THEN ac.count ELSE 0 END), 0) AS scheduled
    FROM dates d
    LEFT JOIN activity_counts ac ON d.date = ac.date
    GROUP BY d.date
    ORDER BY d.date ASC
  )
  SELECT json_build_object(
    'labels', (SELECT json_agg(to_char(date, 'DD/MM')) FROM activity_data_complete),
    'datasets', json_build_array(
      json_build_object(
        'label', 'Atividades Concluídas',
        'data', (SELECT json_agg(completed) FROM activity_data_complete),
        'borderColor', 'rgb(75, 192, 192)',
        'backgroundColor', 'rgba(75, 192, 192, 0.5)'
      ),
      json_build_object(
        'label', 'Atividades Agendadas',
        'data', (SELECT json_agg(scheduled) FROM activity_data_complete),
        'borderColor', 'rgb(53, 162, 235)',
        'backgroundColor', 'rgba(53, 162, 235, 0.5)'
      )
    )
  ) INTO activities_data;

  -- Retornar todos os dados
  RETURN json_build_object(
    'sessionsData', sessions_data,
    'scalesData', scales_data,
    'activitiesData', activities_data
  );
END;
$$ LANGUAGE plpgsql;
