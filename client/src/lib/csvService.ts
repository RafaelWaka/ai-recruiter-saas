// @ts-ignore - papaparse n'a pas de types officiels
import Papa from 'papaparse';
import { z } from 'zod';
import { supabase } from './supabase';

// Schéma de validation Zod pour un candidat
const CandidateSchema = z.object({
  project_id: z.union([z.string(), z.number()]).refine((val) => {
    if (typeof val === 'string') return val.trim() !== '';
    return val != null && !isNaN(Number(val));
  }, 'project_id est requis'),
  nom_complet: z.string().optional().nullable(),
  linkedin_url: z.string().min(1, 'linkedin_url est requis'),
  email: z.string().email().optional().nullable(),
  telephone: z.string().optional().nullable(),
  status: z.string().default('En attente'),
});

// Schéma pour valider le tableau de candidats
const CandidatesArraySchema = z.array(CandidateSchema).min(1, 'Au moins un candidat est requis');

// Taille des lots pour l'insertion batch (évite de surcharger Supabase)
const BATCH_SIZE = 50;

/**
 * Insère les candidats par lots pour éviter de bloquer Supabase
 */
async function insertCandidatesInBatches(
  candidates: z.infer<typeof CandidateSchema>[],
  projectId: string | number
): Promise<{ success: number; errors: any[] }> {
  let successCount = 0;
  const errors: any[] = [];

  // Diviser en lots
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    
    console.log(`[CSV] Insertion du lot ${batchNumber} (${batch.length} candidats)...`);
    console.log(`[CSV] ===== DONNÉES DU LOT ${batchNumber} À INSÉRER DANS SUPABASE =====`);
    console.log(`[CSV] JSON.stringify (tout le lot):`, JSON.stringify(batch, null, 2));
    console.log(`[CSV] Premier candidat (exemple):`, JSON.stringify(batch[0], null, 2));
    console.log(`[CSV] Vérification project_id pour tous les candidats du lot:`);
    batch.forEach((c: any, idx: number) => {
      if (!c.project_id) {
        console.error(`[CSV] ⚠️ Candidat ${idx + 1} du lot ${batchNumber} n'a pas de project_id!`);
      } else {
        console.log(`[CSV]   Candidat ${idx + 1}: project_id = ${c.project_id}`);
      }
    });
    console.log(`[CSV] ============================================================`);
    
    try {
      const { data, error } = await supabase
        .from('Candidats')
        .insert(batch)
        .select();

      if (error) {
        console.error(`[CSV] ERREUR lors de l'insertion du lot ${batchNumber}:`, error);
        console.error(`[CSV] Code d'erreur:`, error.code);
        console.error(`[CSV] Message d'erreur:`, error.message);
        console.error(`[CSV] Détails:`, error.details);
        console.error(`[CSV] Hint:`, error.hint);
        
        // Vérifier si c'est une erreur RLS (Row Level Security)
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('RLS')) {
          console.error(`[CSV] ⚠️ ERREUR RLS: Les politiques de sécurité Supabase bloquent l'insertion.`);
          console.error(`[CSV] Vérifiez vos politiques RLS dans Supabase pour la table 'Candidats'.`);
        }
        
        errors.push({
          batch: batchNumber,
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          candidates: batch.length,
        });
      } else {
        successCount += data?.length || 0;
        console.log(`[CSV] ✓ Lot ${batchNumber} inséré avec succès: ${data?.length || 0} candidats`);
        if (data && data.length > 0) {
          console.log(`[CSV] Exemple de candidat inséré:`, JSON.stringify(data[0], null, 2));
        }
      }
    } catch (error: any) {
      console.error(`[CSV] ERREUR inattendue lors de l'insertion du lot ${batchNumber}:`, error);
      errors.push({
        batch: batchNumber,
        error: error.message || 'Erreur inconnue',
        candidates: batch.length,
      });
    }

    // Petite pause entre les lots pour éviter de surcharger Supabase
    if (i + BATCH_SIZE < candidates.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { success: successCount, errors };
}

/**
 * Récupère le nombre de candidats liés à un project_id
 */
async function getCandidatesCount(projectId: string | number): Promise<number> {
  try {
    const projectIdValue = typeof projectId === 'string' ? Number(projectId) : projectId;
    const { count, error } = await supabase
      .from('Candidats')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectIdValue);

    if (error) {
      console.error('Erreur lors du comptage des candidats:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Erreur inattendue lors du comptage:', error);
    return 0;
  }
}

/**
 * Traite un fichier CSV et importe les candidats dans Supabase
 * 
 * @param file - Le fichier CSV à traiter
 * @param projectId - L'ID du projet auquel lier les candidats (nombre int8)
 * @param mapping - Mapping optionnel des colonnes CSV (nom, prenom, linkedin, email, telephone)
 * @returns Promise qui résout avec les données insérées ou rejette avec une erreur
 */
export const processCSV = async (
  file: File, 
  projectId: string | number,
  mapping?: { nom?: string; prenom?: string; linkedin?: string; email?: string; telephone?: string }
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Convertir projectId en nombre si c'est une string, et valider
      const projectIdNumber = typeof projectId === 'string' 
        ? (projectId.trim() === '' ? null : Number(projectId))
        : projectId;
      
      if (!projectIdNumber || isNaN(projectIdNumber)) {
        const error = new Error('project_id est requis et doit être un nombre valide');
        console.error('[CSV] ERREUR:', error.message);
        reject(error);
        return;
      }

      console.log('[CSV] Début du traitement du fichier:', file.name);
      console.log('[CSV] Project ID (converti en nombre):', projectIdNumber);
      console.log('[CSV] Mapping fourni:', mapping);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<any>) => {
          try {
            console.log('[CSV] CSV parsé avec succès');
            console.log('[CSV] Nombre de lignes:', results.data.length);
            console.log('[CSV] Colonnes détectées:', results.meta.fields);

            // Mapping intelligent : on adapte les noms de colonnes du CSV
            const rawCandidates = results.data.map((row: any, index: number) => {
              // Utiliser le mapping fourni ou détection automatique
              const nomCol = mapping?.nom ? row[mapping.nom] : row.nom || row.name || row.fullname || row['Nom complet'] || row['Nom'] || '';
              const prenomCol = mapping?.prenom ? row[mapping.prenom] : row.prenom || row.firstname || row['Prénom'] || row['Prenom'] || '';
              const linkedinCol = mapping?.linkedin ? row[mapping.linkedin] : row.linkedin || row.url || row.profile || row['LinkedIn URL'] || row['LinkedIn'] || row['linkedin_url'] || '';
              const emailCol = mapping?.email ? row[mapping.email] : row.email || row['Email'] || row['E-mail'] || '';
              const telephoneCol = mapping?.telephone ? row[mapping.telephone] : row.telephone || row.phone || row.tel || row['Téléphone'] || row['Telephone'] || '';

              // Construire le nom complet
              const nomComplet = prenomCol && nomCol 
                ? `${prenomCol} ${nomCol}`.trim()
                : nomCol || prenomCol || '';

              // Objet d'insertion avec uniquement les colonnes de la table Candidats
              const candidate = {
                project_id: projectIdNumber, // Converti en nombre pour Supabase int8
                nom_complet: nomComplet || null,
                linkedin_url: linkedinCol || '',
                email: emailCol || null,
                telephone: telephoneCol || null,
                status: 'En attente' as const, // Statut par défaut
              };

              // Vérification que project_id est bien présent
              if (!candidate.project_id) {
                console.error(`[CSV] ⚠️ ERREUR: project_id manquant pour le candidat ${index + 1}`);
              }

              // Log pour les premières lignes
              if (index < 3) {
                console.log(`[CSV] Candidat ${index + 1} (exemple):`, {
                  nom_complet: candidate.nom_complet,
                  linkedin_url: candidate.linkedin_url,
                  email: candidate.email,
                  telephone: candidate.telephone,
                  project_id: candidate.project_id,
                  status: candidate.status,
                });
              }

              return candidate;
            });
            
            // Log pour vérifier que tous les candidats ont un project_id
            const candidatesWithoutProjectId = rawCandidates.filter((c: any) => !c.project_id);
            if (candidatesWithoutProjectId.length > 0) {
              console.error(`[CSV] ⚠️ ERREUR: ${candidatesWithoutProjectId.length} candidats sans project_id`);
            } else {
              console.log(`[CSV] ✓ Tous les candidats ont un project_id: ${projectIdNumber}`);
            }

            // Filtrer les candidats sans linkedin_url avant validation
            const candidatesWithLinkedIn = rawCandidates.filter(
              (c: any) => c.linkedin_url && c.linkedin_url.trim() !== ''
            );

            console.log(`[CSV] Candidats avec LinkedIn: ${candidatesWithLinkedIn.length} sur ${rawCandidates.length}`);

            if (candidatesWithLinkedIn.length === 0) {
              const error = new Error('Aucun candidat avec une URL LinkedIn valide trouvé dans le CSV');
              console.error('[CSV] ERREUR:', error.message);
              reject(error);
              return;
            }

            // Validation avec Zod
            console.log('[CSV] Validation des candidats avec Zod...');
            const validationResult = CandidatesArraySchema.safeParse(candidatesWithLinkedIn);

            if (!validationResult.success) {
              const errors = validationResult.error.issues.map((err: z.ZodIssue) => 
                `${err.path.join('.')}: ${err.message}`
              ).join(', ');
              
              console.error('Erreurs de validation:', validationResult.error.issues);
              reject(new Error(`Erreurs de validation: ${errors}`));
              return;
            }

            const validCandidates = validationResult.data;

            console.log(`Début de l'importation de ${validCandidates.length} candidats pour le projet ${projectIdNumber}`);

            // Compter les candidats avant l'import
            const countBefore = await getCandidatesCount(String(projectIdNumber));
            console.log(`Nombre de candidats avant import: ${countBefore}`);

            // Insertion par lots
            const { success, errors } = await insertCandidatesInBatches(validCandidates, String(projectIdNumber));

            // Compter les candidats après l'import
            const countAfter = await getCandidatesCount(String(projectIdNumber));
            const newlyAdded = countAfter - countBefore;

            // Logs de confirmation
            console.log('=== Résumé de l\'importation ===');
            console.log(`Candidats traités: ${validCandidates.length}`);
            console.log(`Candidats insérés avec succès: ${success}`);
            console.log(`Candidats ajoutés au projet ${projectIdNumber}: ${newlyAdded}`);
            console.log(`Nombre total de candidats pour le projet ${projectIdNumber}: ${countAfter}`);
            console.log(`Erreurs rencontrées: ${errors.length}`);

            if (errors.length > 0) {
              console.warn('Détails des erreurs:', errors);
            }

            // Si au moins un candidat a été inséré, on résout avec succès
            if (success > 0) {
              // Récupérer les candidats insérés pour les retourner
              const { data: insertedData, error: fetchError } = await supabase
                .from('Candidats')
                .select('*')
                .eq('project_id', projectIdNumber)
                .order('created_at', { ascending: false })
                .limit(success);

              if (fetchError) {
                console.error('[CSV] Erreur lors de la récupération des candidats insérés:', fetchError);
              }

              console.log('[CSV] ✓ Importation terminée avec succès');
              resolve({
                data: insertedData || [],
                summary: {
                  total: validCandidates.length,
                  success,
                  errors: errors.length,
                  countBefore,
                  countAfter,
                  newlyAdded,
                },
              });
            } else {
              // Construire un message d'erreur détaillé
              let errorMessage = 'Aucun candidat n\'a pu être inséré.\n\n';
              
              if (errors.length > 0) {
                const rlsError = errors.find((e: any) => e.code === '42501' || e.error?.includes('permission') || e.error?.includes('RLS'));
                if (rlsError) {
                  errorMessage += '⚠️ ERREUR DE PERMISSIONS SUPABASE (RLS)\n\n';
                  errorMessage += 'Les politiques de sécurité Supabase bloquent l\'insertion.\n';
                  errorMessage += 'Vérifiez vos politiques RLS pour la table "Candidats" dans Supabase.\n\n';
                  errorMessage += `Détails: ${rlsError.error || rlsError.message}\n`;
                  if (rlsError.hint) {
                    errorMessage += `Hint: ${rlsError.hint}\n`;
                  }
                } else {
                  errorMessage += 'Erreurs rencontrées:\n';
                  errors.forEach((err: any, index: number) => {
                    errorMessage += `${index + 1}. Lot ${err.batch}: ${err.error || err.message}\n`;
                    if (err.code) errorMessage += `   Code: ${err.code}\n`;
                    if (err.details) errorMessage += `   Détails: ${err.details}\n`;
                  });
                }
              } else {
                errorMessage += 'Aucune erreur spécifique n\'a été retournée. Vérifiez la console pour plus de détails.';
              }
              
              console.error('[CSV] ERREUR FINALE:', errorMessage);
              reject(new Error(errorMessage));
            }
          } catch (error: any) {
            console.error('Erreur lors du traitement du CSV:', error);
            reject(error);
          }
        },
        error: (error: Error) => {
          console.error('Erreur lors du parsing du CSV:', error);
          reject(error);
        },
      });
    } catch (error: any) {
      console.error('Erreur inattendue:', error);
      reject(error);
    }
  });
};
