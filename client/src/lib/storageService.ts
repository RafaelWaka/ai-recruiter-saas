import { supabase } from "./supabase";

/**
 * Upload un fichier CSV dans le bucket Supabase 'csv-uploads' et retourne l'URL publique
 * 
 * @param file - Le fichier CSV à uploader
 * @param userId - L'ID de l'utilisateur (optionnel, pour organiser les fichiers par utilisateur)
 * @returns Promise<{ success: boolean, url?: string, error?: string }>
 */
export async function uploadCSVToSupabase(
  file: File,
  userId?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Vérifier que le fichier est bien un CSV
    if (!file.name.endsWith('.csv')) {
      return { success: false, error: "Le fichier doit être un fichier CSV" };
    }

    // Générer un nom de fichier unique avec timestamp
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = userId 
      ? `${userId}/${timestamp}_${sanitizedFileName}`
      : `${timestamp}_${sanitizedFileName}`;

    console.log(`[STORAGE] Upload du fichier CSV: ${fileName}`);

    // Uploader le fichier dans le bucket 'csv-uploads'
    const { data, error } = await supabase.storage
      .from('csv-uploads')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false, // Ne pas écraser si le fichier existe déjà
      });

    if (error) {
      console.error("[STORAGE] Erreur lors de l'upload:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Aucune donnée retournée après l'upload" };
    }

    console.log("[STORAGE] Fichier uploadé avec succès:", data.path);

    // Récupérer l'URL publique du fichier
    const { data: urlData } = supabase.storage
      .from('csv-uploads')
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      return { success: false, error: "Impossible de récupérer l'URL publique du fichier" };
    }

    console.log("[STORAGE] URL publique du fichier:", urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erreur inconnue lors de l'upload";
    console.error("[STORAGE] Exception lors de l'upload:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Supprime un fichier CSV du bucket Supabase
 * 
 * @param filePath - Le chemin du fichier dans le bucket (ex: "user_id/timestamp_file.csv")
 * @returns Promise<{ success: boolean, error?: string }>
 */
export async function deleteCSVFromSupabase(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from('csv-uploads')
      .remove([filePath]);

    if (error) {
      console.error("[STORAGE] Erreur lors de la suppression:", error);
      return { success: false, error: error.message };
    }

    console.log("[STORAGE] Fichier supprimé avec succès:", filePath);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erreur inconnue lors de la suppression";
    console.error("[STORAGE] Exception lors de la suppression:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Liste tous les fichiers CSV d'un utilisateur dans le bucket
 * 
 * @param userId - L'ID de l'utilisateur
 * @returns Promise<{ success: boolean, files?: any[], error?: string }>
 */
export async function listUserCSVFiles(
  userId: string
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('csv-uploads')
      .list(`${userId}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error("[STORAGE] Erreur lors de la liste des fichiers:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      files: data || [],
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[STORAGE] Exception lors de la liste:", errorMessage);
    return { success: false, error: errorMessage };
  }
}


