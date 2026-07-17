const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabasePublishableKey || !supabaseSecretKey) {
  console.error("Variables d'environnement Supabase manquantes");
  process.exit(1);
}

const supabaseAnon = createClient(supabaseUrl, supabasePublishableKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);

module.exports = { supabaseAnon, supabaseAdmin };
