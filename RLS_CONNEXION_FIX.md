# Correction des politiques RLS pour la table "Connexion"

## Erreur actuelle
```
new row violates row-level security policy for table "Connexion"
```

## Solution : Configurer les politiques RLS dans Supabase

Exécutez ces commandes SQL dans l'éditeur SQL de Supabase (Dashboard Supabase > SQL Editor).

### Étape 1 : Vérifier que RLS est activé

```sql
-- Vérifier l'état de RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'Connexion';
```

Si `rowsecurity` est `false`, activez-le :

```sql
-- Activer RLS sur la table Connexion
ALTER TABLE "Connexion" ENABLE ROW LEVEL SECURITY;
```

### Étape 2 : Supprimer les anciennes politiques (si elles existent)

```sql
-- Supprimer toutes les politiques existantes sur la table Connexion
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON "Connexion";
DROP POLICY IF EXISTS "Allow users to update their own record" ON "Connexion";
DROP POLICY IF EXISTS "Allow authenticated users to read" ON "Connexion";
DROP POLICY IF EXISTS "Allow authenticated users to insert their own email" ON "Connexion";
DROP POLICY IF EXISTS "Allow users to update their own record" ON "Connexion";
```

### Étape 3 : Créer les nouvelles politiques RLS

#### Politique INSERT (permettre l'insertion pour les utilisateurs authentifiés)

```sql
CREATE POLICY "Allow authenticated users to insert"
ON "Connexion"
FOR INSERT
TO authenticated
WITH CHECK (true);
```

#### Politique UPDATE (permettre la mise à jour pour les utilisateurs authentifiés)

```sql
CREATE POLICY "Allow authenticated users to update"
ON "Connexion"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

#### Politique SELECT (permettre la lecture pour les utilisateurs authentifiés)

```sql
CREATE POLICY "Allow authenticated users to read"
ON "Connexion"
FOR SELECT
TO authenticated
USING (true);
```

### Étape 4 : Vérifier les politiques créées

```sql
-- Vérifier toutes les politiques sur la table Connexion
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'Connexion';
```

### Étape 5 : Test manuel (optionnel)

Pour tester si les politiques fonctionnent, vous pouvez essayer d'insérer manuellement :

```sql
-- Note: Cette requête doit être exécutée en tant qu'utilisateur authentifié
-- via l'API Supabase, pas directement dans l'éditeur SQL
-- (car l'éditeur SQL utilise le service_role qui bypass RLS)
```

## Vérification de la structure de la table

Assurez-vous que votre table "Connexion" a bien cette structure :

```sql
-- Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Connexion'
ORDER BY ordinal_position;
```

La table devrait avoir au minimum :
- `id` (UUID, PRIMARY KEY)
- `email` (TEXT, NOT NULL, UNIQUE)
- `user_id` (UUID, nullable, peut référencer auth.users(id))
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## Si la table n'existe pas encore

Si la table "Connexion" n'existe pas, créez-la avec :

```sql
CREATE TABLE "Connexion" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer un index sur email
CREATE INDEX idx_connexion_email ON "Connexion"(email);

-- Créer un index sur user_id
CREATE INDEX idx_connexion_user_id ON "Connexion"(user_id);

-- Activer RLS
ALTER TABLE "Connexion" ENABLE ROW LEVEL SECURITY;
```

## Notes importantes

1. **Guillemets doubles** : La table s'appelle "Connexion" avec une majuscule, donc utilisez toujours des guillemets doubles dans SQL.

2. **Authentification requise** : Les politiques ci-dessus nécessitent que l'utilisateur soit authentifié (`TO authenticated`). C'est pourquoi nous utilisons `getUser()` dans le code pour s'assurer que l'utilisateur est bien authentifié.

3. **Service Role** : Si vous testez dans l'éditeur SQL de Supabase, vous utilisez le `service_role` qui bypass RLS. Les politiques RLS ne s'appliquent qu'aux requêtes faites via l'API avec la clé `anon` ou `authenticated`.

4. **Test dans l'application** : Après avoir configuré les politiques, testez dans votre application en vous connectant avec Google. Les logs dans la console du navigateur vous indiqueront si l'insertion fonctionne.

## Dépannage

Si l'erreur persiste après avoir configuré les politiques :

1. Vérifiez que RLS est bien activé : `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'Connexion';`
2. Vérifiez que les politiques existent : `SELECT * FROM pg_policies WHERE tablename = 'Connexion';`
3. Vérifiez dans la console du navigateur que `getUser()` retourne bien un utilisateur authentifié
4. Vérifiez que le token d'authentification est bien présent dans la session


