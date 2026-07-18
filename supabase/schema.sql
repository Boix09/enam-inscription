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
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pre_enrolled (
  id SERIAL PRIMARY KEY,
  no INTEGER NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  registered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_enrolled ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT, SELECT ON TABLE students TO anon;
GRANT SELECT ON TABLE pre_enrolled TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

CREATE POLICY insert_policy ON students FOR INSERT WITH CHECK (true);
CREATE POLICY select_pre_enrolled ON pre_enrolled FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_students_no ON students (no);
CREATE INDEX IF NOT EXISTS idx_pre_enrolled_nom ON pre_enrolled (nom);
