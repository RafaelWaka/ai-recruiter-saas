import { supabase } from "@/lib/supabase";
import { registerUserOnLogin } from "@/lib/authService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { toast } from "sonner";
import { triggerConfetti } from "@/lib/celebration";

export default function AuthPage() {
  const [, setLocation] = useLocation();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/',
      },
    });
    
    if (error) {
      console.error("Erreur d'authentification :", error.message);
      toast.error("Erreur lors de la connexion avec Google.");
    }
  };

  // Vérifier la session au chargement de la page (pour gérer le retour du callback OAuth)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("[AUTH] Session trouvée au chargement, enregistrement de l'utilisateur...");
        const result = await registerUserOnLogin(session);
        if (result.success) {
          console.log("[AUTH] Utilisateur enregistré avec succès dans la table Connexion");
          // Déclencher les confettis
          triggerConfetti();
          // Afficher le toast avec emoji et style personnalisé
          toast.success("🎉 Bravo, vous êtes bien inscrit sur la liste ! 🎉", {
            duration: 5000,
            style: {
              fontSize: '18px',
              padding: '20px',
              fontWeight: '600',
            },
          });
          // Déconnecter l'utilisateur pour qu'il reste sur la landing page
          await supabase.auth.signOut();
          console.log("[AUTH] Utilisateur déconnecté après inscription");
          setLocation('/');
        } else {
          console.error("[AUTH] Échec de l'enregistrement:", result.error);
          toast.error(`Erreur lors de l'inscription à la waiting list: ${result.error}`);
        }
      }
    };
    checkSession();
  }, [setLocation]);

  // Écouter les changements d'authentification pour enregistrer l'utilisateur
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AUTH] Événement d'authentification:", event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        console.log("[AUTH] Connexion détectée, enregistrement de l'utilisateur...");
        // Enregistrer automatiquement l'utilisateur dans la table 'Connexion'
        const result = await registerUserOnLogin(session);
        if (result.success) {
          console.log("[AUTH] Utilisateur enregistré avec succès dans la table Connexion");
          // Déclencher les confettis
          triggerConfetti();
          // Afficher le toast avec emoji et style personnalisé
          toast.success("🎉 Bravo, vous êtes bien inscrit sur la liste ! 🎉", {
            duration: 5000,
            style: {
              fontSize: '18px',
              padding: '20px',
              fontWeight: '600',
            },
          });
          // Déconnecter l'utilisateur pour qu'il reste sur la landing page
          await supabase.auth.signOut();
          console.log("[AUTH] Utilisateur déconnecté après inscription");
          // Rediriger vers la home page
          setLocation('/');
        } else {
          console.error("[AUTH] Échec de l'enregistrement:", result.error);
          toast.error(`Erreur lors de l'inscription à la waiting list: ${result.error}`);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <Card className="max-w-md w-full border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
        <CardContent className="pt-12 pb-12 px-8 flex flex-col items-center">
          <button 
            onClick={() => setLocation("/")}
            className="self-start mb-8 flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </button>

          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            Prêt à recruter les meilleurs talents ?
          </h1>
          <p className="text-zinc-400 mb-10 text-center">
            Connectez-vous pour activer votre armée de 100 chasseurs de têtes.
          </p>
          
          <Button 
            onClick={handleGoogleLogin}
            size="lg" 
            className="w-full py-7 text-lg flex gap-4 items-center justify-center bg-white text-black hover:bg-zinc-200 transition-all shadow-xl"
          >
            <Mail className="w-6 h-6" />
            Continuer avec Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}