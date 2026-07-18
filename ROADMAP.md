# ENAM - Prochaines étapes

## Fonctionnalités à implémenter (par ordre de priorité)

### 1. Option A — Tokens individuels par élève
**Problème** : Un élève sur la liste pré-inscrite peut soumettre sous le nom d'un autre.

**Solution** : Chaque pré-inscrit reçoit un lien personnel avec token unique.
- Admin clique "Générer liens" → token créé pour chaque pré-inscrit
- Lien : `...?token=abc123` → nom/prénom verrouillés en lecture seule
- Token à usage unique (une fois soumis, plus valide)
- **Variante** : générer N tokens vierges pour les classes sans pré-inscrits

### 2. Option B — Vérification téléphone + nom
Alternative à l'Option A.
- Le numéro de téléphone doit correspondre à celui enregistré dans la liste pré-inscrite
- Empêche de soumettre pour quelqu'un d'autre sans connaître son téléphone

### 3. Mode validation manuelle (Option C)
- Toggle dans l'admin : "Approbation requise"
- Les soumissions apparaissent en "en attente"
- L'admin valide ou rejette depuis le dashboard

### 4. Interface admin — Chargement des pré-inscrits
- Onglet dédié pour voir, ajouter, modifier la liste des pré-inscrits
- Upload CSV possible

### 5. Rate limiting
- Limiter le nombre de soumissions par IP/minute
- Éviter le spam en complément des autres mesures

### 6. Export amélioré
- Filtrer par statut (validé/en attente/refusé)

---

## Composants déjà en place
- ✅ Journalisation complète (IP, user-agent, écran, langue, fuseau, appareil, provenance)
- ✅ Anti-doublon nom+prénom par classe
- ✅ Téléphone unique par classe
- ✅ Suppression soft (retirer/restaurer)
- ✅ Export Word + Excel avec logo
- ✅ WhatsApp configurable
- ✅ Multi-promotions/classes avec slugs
