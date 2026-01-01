import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function AuthPage() {
  const [, setLocation] = useLocation();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    });
    
    if (error) {
      console.error("Erreur d'authentification :", error.message);
      alert("Erreur lors de la connexion avec Google.");
    }
  };

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