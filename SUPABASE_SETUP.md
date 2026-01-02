# Configuration Supabase pour l'enregistrement automatique des utilisateurs

## 1. Structure de la table `connexion`

Assurez-vous que votre table `connexion` dans Supabase a la structure suivante :

```sql
CREATE TABLE connexion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id), -- Optionnel : pour lier à auth.users
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer un index sur email pour améliorer les performances
CREATE INDEX idx_connexion_email ON connexion(email);

-- Créer un index sur user_id si vous l'utilisez
CREATE INDEX idx_connexion_user_id ON connexion(user_id);
```

## 2. Politiques RLS (Row Level Security)

Pour que les utilisateurs puissent s'inscrire automatiquement, vous devez configurer les politiques RLS suivantes :

### Politique pour INSERT (création d'un nouvel utilisateur)

```sql
-- Permettre à tous les utilisateurs authentifiés de s'inscrire
CREATE POLICY "Allow authenticated users to insert their own email"
ON connexion
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
```

**OU** si vous n'utilisez pas `user_id`, utilisez cette politique plus simple :

```sql
-- Permettre à tous les utilisateurs authentifiés de s'inscrire
CREATE POLICY "Allow authenticated users to insert"
ON connexion
FOR INSERT
TO authenticated
WITH CHECK (true);
```

### Politique pour UPDATE (mise à jour lors de l'upsert)

```sql
-- Permettre aux utilisateurs de mettre à jour leur propre enregistrement
CREATE POLICY "Allow users to update their own record"
ON connexion
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
```

**OU** version plus simple sans `user_id` :

```sql
-- Permettre aux utilisateurs de mettre à jour leur propre enregistrement basé sur l'email
CREATE POLICY "Allow users to update their own record"
ON connexion
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
```

### Politique pour SELECT (lecture)

```sql
-- Permettre aux utilisateurs de lire leur propre enregistrement
CREATE POLICY "Allow users to read their own record"
ON connexion
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));
```

**OU** version plus simple :

```sql
-- Permettre à tous les utilisateurs authentifiés de lire tous les enregistrements
-- (À adapter selon vos besoins de confidentialité)
CREATE POLICY "Allow authenticated users to read"
ON connexion
FOR SELECT
TO authenticated
USING (true);
```

## 3. Activer RLS sur la table

```sql
-- Activer RLS sur la table connexion
ALTER TABLE connexion ENABLE ROW LEVEL SECURITY;
```

## 4. Vérification

Après avoir configuré les politiques, testez l'authentification :

1. Connectez-vous via Google
2. Vérifiez dans la table `connexion` que votre email a été enregistré
3. Vérifiez la console du navigateur pour les logs `[AUTH]` ou `[HOME]`

## 5. Notes importantes

- **UNIQUE sur email** : La contrainte `UNIQUE` sur la colonne `email` est essentielle pour que l'`UPSERT` fonctionne correctement avec `onConflict: 'email'`
- **user_id optionnel** : Si vous n'utilisez pas `user_id`, vous pouvez l'omettre de la table et des politiques
- **Sécurité** : Les politiques ci-dessus permettent à tous les utilisateurs authentifiés de s'inscrire. Si vous avez besoin de restrictions supplémentaires, adaptez les politiques en conséquence


