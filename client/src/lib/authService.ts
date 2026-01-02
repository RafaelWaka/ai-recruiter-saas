import { supabase } from "./supabase";
import { Session } from "@supabase/supabase-js";

/**
 * Enregistre automatiquement un utilisateur dans la table 'Connexion' lors de sa connexion
 * Utilise un UPSERT pour éviter les doublons basé sur l'email
 * 
 * @param session - La session Supabase de l'utilisateur connecté
 * @returns Promise<{ success: boolean, error?: string }>
 */
export async function registerUserOnLogin(session: Session | null): Promise<{ success: boolean; error?: string }> {
  // Vérifier que la session existe et contient un email
  if (!session?.user?.email) {
    return { success: false, error: "Aucune session ou email trouvé" };
  }

  try {
    // Attendre la confirmation de l'authentification avec getUser() pour forcer l'attente du token
    console.log("[AUTH] Vérification de l'authentification avec getUser()...");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("[AUTH] Erreur lors de la récupération de l'utilisateur:", userError);
      return { success: false, error: userError?.message || "Utilisateur non authentifié" };
    }

    // Vérifier que l'utilisateur a bien un email
    if (!user.email) {
      return { success: false, error: "Email de l'utilisateur non trouvé" };
    }

    const email = user.email;
    const userId = user.id;

    console.log("[AUTH] Utilisateur authentifié confirmé:", { email, userId });

    // Vérifier d'abord si l'utilisateur existe déjà (sans utiliser .single() pour éviter les erreurs)
    const { data: existingUsers, error: checkError } = await supabase
      .from('Connexion')
      .select('email, user_id')
      .eq('email', email)
      .limit(1);

    // checkError peut être ignoré si c'est juste "pas de résultat"
    const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

    const now = new Date().toISOString();
    // Objet d'insertion avec email et user_id
    const dataToUpsert: any = {
      email: email,
      user_id: userId,
      updated_at: now,
    };

    // Si l'utilisateur n'existe pas, ajouter created_at
    if (!existingUser) {
      dataToUpsert.created_at = now;
    }

    // Log de la session juste avant l'insertion
    console.log("[AUTH] Session complète avant insertion:", session);
    console.log(`[AUTH] Tentative d'enregistrement pour: ${email}`, { existingUser: !!existingUser, dataToUpsert });

    // Utiliser UPSERT pour éviter les doublons
    // Si l'email existe déjà, on met à jour, sinon on insère
    const { error, data } = await supabase
      .from('Connexion')
      .upsert(
        dataToUpsert,
        {
          onConflict: 'email', // La colonne email doit être unique ou avoir une contrainte unique
        }
      )
      .select();

    if (error) {
      console.error("[AUTH] Erreur lors de l'enregistrement de l'utilisateur:", error);
      console.error("[AUTH] Détails de l'erreur:", JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }

    console.log(`[AUTH] Utilisateur ${existingUser ? 'mis à jour' : 'enregistré'} avec succès: ${email}`, data);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[AUTH] Exception lors de l'enregistrement:", errorMessage);
    console.error("[AUTH] Stack trace:", err instanceof Error ? err.stack : 'N/A');
    return { success: false, error: errorMessage };
  }
}

