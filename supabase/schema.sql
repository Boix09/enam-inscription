-- ============================================================
-- Schéma ENAM - Collecte d'informations élèves
-- ============================================================

-- 1. Créer la table students
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

-- 2. Activer Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 3. Politique INSERT : autorisée pour le rôle anon (élèves sans compte)
CREATE POLICY "Les élèves peuvent insérer leur fiche"
  ON students
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 4. Politique SELECT : interdite pour anon
--    Seule la clé service_role (côté serveur) peut lire
CREATE POLICY "Lecture interdite pour anon"
  ON students
  FOR SELECT
  TO anon
  USING (false);

-- 5. Index utile pour le tri par numéro
CREATE INDEX IF NOT EXISTS idx_students_no ON students (no);
