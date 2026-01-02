import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer une instance Supabase côté serveur
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Les variables d'environnement Supabase sont manquantes !");
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Fonction pour gérer l'enrichissement Surfe
async function handleSurfeEnrichment(payload: any) {
  const { id, linkedin_url, status } = payload.new;
  
  // Vérifier que le statut est 'A_ENRICHIR' et qu'il y a une URL LinkedIn
  if (status !== 'A_ENRICHIR') {
    console.log(`[ENRICHISSEMENT] Candidat ${id} ignoré - statut: ${status} (attendu: A_ENRICHIR)`);
    return;
  }

  if (!linkedin_url) {
    console.warn(`[ENRICHISSEMENT] Candidat ${id} ignoré - linkedin_url manquante`);
    // Marquer comme erreur si pas d'URL LinkedIn
    try {
      await supabase
        .from('Candidats')
        .update({ status: 'ERRE_ENRICHISSEMENT' })
        .eq('id', id);
      console.log(`[ENRICHISSEMENT] Candidat ${id} marqué comme ERRE_ENRICHISSEMENT (linkedin_url manquante)`);
    } catch (updateError) {
      console.error(`[ENRICHISSEMENT] Erreur lors de la mise à jour du statut pour candidat ${id}:`, updateError);
    }
    return;
  }

  console.log(`[ENRICHISSEMENT] Début de l'enrichissement pour candidat ${id}`);
  console.log(`[ENRICHISSEMENT] LinkedIn URL: ${linkedin_url}`);

  // Vérifier que la clé API est présente
  if (!process.env.SURFE_API_KEY) {
    console.error(`[ENRICHISSEMENT] ERREUR: SURFE_API_KEY manquante dans les variables d'environnement`);
    try {
      await supabase
        .from('Candidats')
        .update({ status: 'ERRE_ENRICHISSEMENT' })
        .eq('id', id);
      console.log(`[ENRICHISSEMENT] Candidat ${id} marqué comme ERRE_ENRICHISSEMENT (clé API manquante)`);
    } catch (updateError) {
      console.error(`[ENRICHISSEMENT] Erreur lors de la mise à jour du statut pour candidat ${id}:`, updateError);
    }
    return;
  }

  try {
    console.log(`[ENRICHISSEMENT] Appel de l'API Surfe pour candidat ${id}...`);
    
    const response = await axios.post(
      'https://api.surfe.com/v1/enrich',
      { linkedinUrl: linkedin_url },
      {
        headers: {
          'Authorization': `Bearer ${process.env.SURFE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // Timeout de 30 secondes
      }
    );

    console.log(`[ENRICHISSEMENT] Réponse API Surfe reçue pour candidat ${id}`);
    console.log(`[ENRICHISSEMENT] Données reçues:`, JSON.stringify(response.data, null, 2));

    const { email, phone } = response.data || {};
    
    // Vérifier que nous avons au moins une donnée enrichie
    if (!email && !phone) {
      console.warn(`[ENRICHISSEMENT] Aucune donnée enrichie (email/phone) reçue pour candidat ${id}`);
    }
    
    console.log(`[ENRICHISSEMENT] Données extraites - Email: ${email || 'N/A'}, Téléphone: ${phone || 'N/A'}`);
    console.log(`[ENRICHISSEMENT] Mise à jour du candidat ${id} dans Supabase...`);
    
    // Mettre à jour le candidat avec les données enrichies
    const { error: updateError } = await supabase
      .from('Candidats')
      .update({
        email: email || null,
        phone: phone || null,
        status: 'PRET_SEQUENCE',
      })
      .eq('id', id);

    if (updateError) {
      console.error(`[ENRICHISSEMENT] ERREUR lors de la mise à jour du candidat ${id} dans Supabase:`, updateError);
      // En cas d'erreur de mise à jour, marquer comme erreur d'enrichissement
      try {
        await supabase
          .from('Candidats')
          .update({ status: 'ERRE_ENRICHISSEMENT' })
          .eq('id', id);
        console.log(`[ENRICHISSEMENT] Candidat ${id} marqué comme ERRE_ENRICHISSEMENT (erreur de mise à jour)`);
      } catch (markError) {
        console.error(`[ENRICHISSEMENT] Erreur critique lors du marquage d'erreur pour candidat ${id}:`, markError);
      }
    } else {
      console.log(`[ENRICHISSEMENT] ✓ Succès complet pour candidat ${id}`);
      console.log(`[ENRICHISSEMENT] ✓ Statut mis à jour: A_ENRICHIR → PRET_SEQUENCE`);
      console.log(`[ENRICHISSEMENT] ✓ Email: ${email || 'Non fourni'}`);
      console.log(`[ENRICHISSEMENT] ✓ Téléphone: ${phone || 'Non fourni'}`);
    }
  } catch (error: any) {
    // Gestion complète des erreurs
    console.error(`[ENRICHISSEMENT] ERREUR lors de l'enrichissement du candidat ${id}:`);
    
    if (error.response) {
      // Erreur de réponse de l'API
      console.error(`[ENRICHISSEMENT] Code HTTP: ${error.response.status}`);
      console.error(`[ENRICHISSEMENT] Message: ${error.response.data?.message || error.response.statusText}`);
      console.error(`[ENRICHISSEMENT] Données de réponse:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // Requête envoyée mais pas de réponse (API hors ligne, timeout, etc.)
      console.error(`[ENRICHISSEMENT] Aucune réponse de l'API Surfe (API peut être hors ligne ou timeout)`);
      console.error(`[ENRICHISSEMENT] Détails de la requête:`, error.request);
    } else {
      // Erreur lors de la configuration de la requête
      console.error(`[ENRICHISSEMENT] Erreur de configuration: ${error.message}`);
    }

    // Marquer le candidat comme erreur d'enrichissement
    try {
      console.log(`[ENRICHISSEMENT] Marquage du candidat ${id} comme ERRE_ENRICHISSEMENT...`);
      const { error: markError } = await supabase
        .from('Candidats')
        .update({ status: 'ERRE_ENRICHISSEMENT' })
        .eq('id', id);

      if (markError) {
        console.error(`[ENRICHISSEMENT] ERREUR lors du marquage d'erreur pour candidat ${id}:`, markError);
      } else {
        console.log(`[ENRICHISSEMENT] ✓ Candidat ${id} marqué comme ERRE_ENRICHISSEMENT`);
      }
    } catch (markException) {
      console.error(`[ENRICHISSEMENT] ERREUR CRITIQUE lors du marquage d'erreur pour candidat ${id}:`, markException);
    }
  }
}

// Fonction pour envoyer un SMS de contact via Twilio ou Resend
async function sendSMSContact(phone: string, message: string) {
  // Option 1: Utiliser Twilio
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const response = await axios.post(
        twilioUrl,
        new URLSearchParams({
          To: phone,
          From: process.env.TWILIO_PHONE_NUMBER || '',
          Body: message,
        }),
        {
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID,
            password: process.env.TWILIO_AUTH_TOKEN,
          },
        }
      );
      console.log(`SMS envoyé via Twilio:`, response.data.sid);
      return { success: true, provider: 'twilio', sid: response.data.sid };
    } catch (error: any) {
      console.error(`Erreur Twilio:`, error.message || error);
      throw error;
    }
  }
  
  // Option 2: Utiliser Resend (API SMS)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.resend.com/sms',
        {
          to: phone,
          message: message,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`SMS envoyé via Resend:`, response.data);
      return { success: true, provider: 'resend', id: response.data.id };
    } catch (error: any) {
      console.error(`Erreur Resend:`, error.message || error);
      throw error;
    }
  }
  
  // Mode développement: simuler l'envoi
  console.log(`[DEV] SMS simulé vers ${phone}: ${message}`);
  return { success: true, provider: 'dev', simulated: true };
}

// Fonction pour gérer l'envoi de SMS lorsque le statut passe à 'PRET_SEQUENCE'
async function handleSMSContact(payload: any) {
  const { id, status, phone, name, project_id } = payload.new;
  const oldStatus = payload.old?.status;
  
  // Vérifier que le statut vient de passer à 'PRET_SEQUENCE' et qu'il y a un téléphone
  if (status !== 'PRET_SEQUENCE' || oldStatus === 'PRET_SEQUENCE' || !phone) {
    return;
  }

  try {
    console.log(`Envoi de SMS de contact pour candidat ${id}...`);
    
    // Récupérer les informations du projet/recruteur
    let recruiterName = 'notre équipe';
    let redirectUrl = `${process.env.APP_URL || 'https://app.hunterai.com'}/candidat/${id}`;
    
    if (project_id) {
      const { data: project, error: projectError } = await supabase
        .from('Projets')
        .select('nom, recruteur_nom')
        .eq('id', project_id)
        .single();
      
      if (!projectError && project) {
        recruiterName = project.recruteur_nom || project.nom || recruiterName;
      }
    }
    
    // Construire le message SMS
    const message = `Bonjour ${name || 'candidat'}, je suis l'assistant IA de ${recruiterName}. Seriez-vous disponible pour un échange de 5 min ? ${redirectUrl}`;
    
    // Envoyer le SMS
    const result = await sendSMSContact(phone, message);
    
    if (result.success) {
      // Mettre à jour le statut du candidat pour indiquer que le SMS a été envoyé
      const { error: updateError } = await supabase
        .from('Candidats')
        .update({
          status: 'CONTACTE',
          date_contact: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (updateError) {
        console.error(`Erreur lors de la mise à jour du statut pour candidat ${id}:`, updateError);
      } else {
        console.log(`SMS envoyé avec succès pour candidat ${id} via ${result.provider}`);
      }
    }
  } catch (error: any) {
    console.error(`Erreur lors de l'envoi du SMS pour candidat ${id}:`, error.message || error);
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Configurer le channel Supabase Realtime pour écouter les INSERT (enrichissement Surfe)
  const channelInsert = supabase
    .channel('candidats-insert')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'Candidats',
      },
      (payload) => {
        handleSurfeEnrichment(payload);
      }
    )
    .subscribe();

  // Configurer le channel Supabase Realtime pour écouter les UPDATE (envoi SMS)
  // On écoute tous les UPDATE et on vérifie dans handleSMSContact si le statut vient de passer à 'PRET_SEQUENCE'
  const channelUpdate = supabase
    .channel('candidats-update')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'Candidats',
      },
      (payload) => {
        handleSMSContact(payload);
      }
    )
    .subscribe();

  console.log('Channels Supabase Realtime configurés:');
  console.log('  - INSERT sur la table Candidats (enrichissement Surfe)');
  console.log('  - UPDATE vers PRET_SEQUENCE sur la table Candidats (envoi SMS)');

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
