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

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL
);

INSERT INTO settings (key, value) VALUES ('whatsapp', '+50938817140') ON CONFLICT (key) DO NOTHING;

GRANT SELECT ON TABLE settings TO anon;

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

-- Feature flags (contrôlées par le super admin)
CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT false,
  label TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO feature_flags (key, enabled, label, description) VALUES
  ('tokens_individuels', false, 'Tokens individuels', 'Tokens individuels pour les élèves'),
  ('tokens_vierges', false, 'Tokens vierges', 'Générer des tokens vierges'),
  ('gerer_pre_inscrits', false, 'Gérer pré-inscrits', 'Interface de gestion des pré-inscrits'),
  ('validation_manuelle', false, 'Validation manuelle', 'Validation manuelle des inscriptions'),
  ('mode_sombre', false, 'Mode sombre', 'Activer le mode sombre sur le site'),
  ('theme_couleurs', false, 'Thème couleurs', 'Personnaliser les couleurs du thème'),
  ('banniere_annonce', false, 'Bannière annonce', 'Afficher une bannière d''annonce sur toutes les pages'),
  ('recherche_globale', false, 'Recherche globale', 'Barre de recherche dans tout le site'),
  ('carte_eleves', false, 'Carte des élèves', 'Vue carte des élèves par localisation'),
  ('api_publique', false, 'API publique', 'Activer l\'API publique pour les intégrations')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_feature_flags ON feature_flags FOR SELECT USING (true);
CREATE POLICY update_feature_flags ON feature_flags FOR UPDATE USING (true);
GRANT SELECT ON TABLE feature_flags TO anon;

-- Journal des actions super admin
CREATE TABLE IF NOT EXISTS super_admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE super_admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_sa_logs ON super_admin_logs FOR SELECT USING (true);
CREATE POLICY insert_sa_logs ON super_admin_logs FOR INSERT WITH CHECK (true);
