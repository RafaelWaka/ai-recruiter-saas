# Guide de débogage - Authentification Google et enregistrement dans la waiting list

## Problèmes corrigés

### 1. Gestion d'erreur améliorée dans `authService.ts`
- Remplacement de `.single()` par `.limit(1)` pour éviter les erreurs quand l'utilisateur n'existe pas
- Ajout de logs détaillés pour suivre le processus
- Meilleure gestion des erreurs avec messages explicites

### 2. Vérification de session au chargement
- Ajout d'une vérification de session au chargement de la page pour capturer le retour du callback OAuth
- Cela garantit que même si l'événement `SIGNED_IN` est manqué, l'utilisateur sera enregistré

### 3. Logs améliorés
- Logs détaillés à chaque étape pour faciliter le débogage
- Messages d'erreur plus explicites dans les toasts

## Vérifications à faire dans Supabase

### 1. Vérifier que la table `connexion` existe

Exécutez ce SQL dans l'éditeur SQL de Supabase :

```sql
-- Vérifier que la table existe
SELECT * FROM connexion LIMIT 1;
```

Si la table n'existe pas, créez-la :

```sql
CREATE TABLE connexion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_connexion_email ON connexion(email);
```

### 2. Vérifier les politiques RLS

```sql
-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'connexion';

-- Vérifier les politiques existantes
SELECT * FROM pg_policies WHERE tablename = 'connexion';
```

Si les politiques n'existent pas, créez-les :

```sql
-- Activer RLS
ALTER TABLE connexion ENABLE ROW LEVEL SECURITY;

-- Politique INSERT
CREATE POLICY "Allow authenticated users to insert"
ON connexion
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique UPDATE
CREATE POLICY "Allow users to update their own record"
ON connexion
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Politique SELECT
CREATE POLICY "Allow authenticated users to read"
ON connexion
FOR SELECT
TO authenticated
USING (true);
```

### 3. Vérifier la contrainte UNIQUE sur email

```sql
-- Vérifier les contraintes
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'connexion'::regclass;
```

Si la contrainte UNIQUE n'existe pas :

```sql
ALTER TABLE connexion ADD CONSTRAINT connexion_email_unique UNIQUE (email);
```

## Comment tester

1. **Ouvrir la console du navigateur** (F12)
2. **Cliquer sur "Accès anticipé"**
3. **Se connecter avec Google**
4. **Vérifier les logs dans la console** :
   - `[HOME] Événement d'authentification: SIGNED_IN`
   - `[AUTH] Tentative d'enregistrement pour: votre@email.com`
   - `[AUTH] Utilisateur enregistré avec succès: votre@email.com`
5. **Vérifier dans Supabase** :
   - Aller dans la table `connexion`
   - Vérifier que votre email apparaît

## Erreurs courantes et solutions

### Erreur : "new row violates row-level security policy"
**Solution** : Vérifiez que les politiques RLS sont correctement configurées (voir section 2)

### Erreur : "duplicate key value violates unique constraint"
**Solution** : C'est normal si l'utilisateur existe déjà. L'UPSERT devrait mettre à jour l'enregistrement.

### Erreur : "relation 'connexion' does not exist"
**Solution** : Créez la table `connexion` (voir section 1)

### Le toast affiche une erreur mais l'utilisateur est connecté
**Solution** : Vérifiez les logs dans la console pour voir l'erreur exacte. C'est probablement un problème de permissions RLS.

## Vérification des variables d'environnement

Assurez-vous que ces variables sont définies dans votre `.env` :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

## Test manuel dans Supabase

Pour tester directement dans Supabase :

```sql
-- Insérer manuellement un utilisateur (remplacez l'email)
INSERT INTO connexion (email, created_at, updated_at)
VALUES ('test@example.com', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET updated_at = NOW();

-- Vérifier l'insertion
SELECT * FROM connexion WHERE email = 'test@example.com';
```

Si cette requête fonctionne mais pas l'application, c'est un problème de permissions RLS.


