CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  annee_debut INTEGER NOT NULL,
  annee_fin INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promotion_id, slug)
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no SERIAL NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone_whatsapp TEXT,
  telephone_appel TEXT,
  adresse TEXT,
  contact_nom TEXT,
  contact_lien TEXT,
  contact_telephone TEXT,
  classe_id UUID REFERENCES classes(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pre_enrolled (
  id SERIAL PRIMARY KEY,
  no INTEGER NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  registered BOOLEAN DEFAULT false,
  classe_id UUID REFERENCES classes(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_enrolled ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT, SELECT ON TABLE students TO anon;
GRANT SELECT ON TABLE pre_enrolled TO anon;
GRANT SELECT ON TABLE promotions TO anon;
GRANT SELECT ON TABLE classes TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

CREATE POLICY insert_policy ON students FOR INSERT WITH CHECK (true);
CREATE POLICY select_pre_enrolled ON pre_enrolled FOR SELECT USING (true);
CREATE POLICY select_promotions ON promotions FOR SELECT USING (true);
CREATE POLICY select_classes ON classes FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_students_no ON students (no);
CREATE INDEX IF NOT EXISTS idx_pre_enrolled_nom ON pre_enrolled (nom);
CREATE INDEX IF NOT EXISTS idx_classes_promotion ON classes (promotion_id);
CREATE INDEX IF NOT EXISTS idx_students_classe ON students (classe_id);
CREATE INDEX IF NOT EXISTS idx_pre_enrolled_classe ON pre_enrolled (classe_id);

CREATE TABLE IF NOT EXISTS submission_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_nom TEXT,
  student_prenom TEXT,
  classe_id UUID REFERENCES classes(id),
  ip_address TEXT,
  user_agent TEXT,
  screen_resolution TEXT,
  language TEXT,
  timezone TEXT,
  platform TEXT,
  device_type TEXT,
  referrer TEXT,
  page_url TEXT,
  success BOOLEAN DEFAULT false,
  reject_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE submission_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_submission_logs ON submission_logs FOR SELECT USING (true);
CREATE POLICY insert_submission_logs ON submission_logs FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_submission_logs_classe ON submission_logs (classe_id);
CREATE INDEX IF NOT EXISTS idx_submission_logs_created ON submission_logs (created_at DESC);
