/* Design Philosophy: Minimalisme Cinétique
 * - Grille mathématique stricte avec proportions dorées
 * - Animations séquencées illustrant le flux automatisé
 * - Palette: blanc cassé, anthracite, orange brûlé
 * - Typographie: Archivo Black (display) + Work Sans (body)
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, Upload, Phone, Calendar, CheckCircle2, TrendingUp, Users, Clock, DollarSign, Mail, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert([
          {
            email: email.trim().toLowerCase(),
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        console.error("Erreur lors de l'inscription:", error);
        alert("Une erreur est survenue. Veuillez réessayer.");
      } else {
        setIsSubmitted(true);
        setEmail("");
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert([
          {
            email: waitlistEmail.trim().toLowerCase(),
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        console.error("Erreur lors de l'inscription:", error);
        alert("Une erreur est survenue. Veuillez réessayer.");
      } else {
        setWaitlistSubmitted(true);
        setWaitlistEmail("");
        setTimeout(() => {
          setShowWaitlistModal(false);
          setWaitlistSubmitted(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  if (showUpload) {
    return <UploadPage onBack={() => setShowUpload(false)} />;
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="font-display text-xl tracking-tight">
              HunterAI
            </div>
            <div className="flex items-center gap-6">
              <a href="#fonctionnement" className="text-sm hover:text-primary transition-colors duration-150">
                Fonctionnement
              </a>
              <a href="#avantages" className="text-sm hover:text-primary transition-colors duration-150">
                Avantages
              </a>
              <a href="#integrations" className="text-sm hover:text-primary transition-colors duration-150">
                Intégration
              </a>
              <Button size="sm" className="transition-all duration-150 hover:scale-105" onClick={() => setShowWaitlistModal(true)}>
                Accès anticipé
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url(/images/hero-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`space-y-8 ${isVisible ? 'animate-slide-in-left' : 'opacity-0'}`}>
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-sm">
                <span className="text-sm font-medium text-primary">Agent IA de Recrutement</span>
              </div>
              <h1 className="font-display text-6xl lg:text-7xl leading-[0.95] tracking-tight text-foreground">
                Recrutez à la vitesse de 100 chasseurs de têtes
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Notre agent IA appelle et qualifie des centaines de candidats en simultané pendant que vous vous concentrez sur les candidats de qualités.
              </p>
              <div className="flex gap-4">
                <Button size="lg" variant="outline" className="transition-all duration-150 hover:scale-105" onClick={() => document.getElementById('fonctionnement')?.scrollIntoView({ behavior: 'smooth' })}>
                  Voir le fonctionnement
                </Button>
              </div>

            </div>
            <div className={`relative ${isVisible ? 'animate-slide-in-right' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-center h-96 bg-card rounded-lg border border-border">
                <Button size="lg" onClick={() => setShowWaitlistModal(true)} className="group transition-all duration-150 hover:scale-105">
                  <Upload className="mr-2 h-5 w-5" />
                  Importez CSV de LinkedIn Recruiter
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="line-separator" />

      {/* How It Works Section */}
      <section id="fonctionnement" className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl tracking-tight mb-4">
              Comment ça fonctionne
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Un processus simple en 4 étapes pour automatiser votre recrutement de bout en bout
            </p>
          </div>

          <div className="relative">
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <WorkflowStep
                number="01"
                icon={<Upload className="h-8 w-8" />}
                title="Importez vos candidats"
                description="Uploadez un fichier CSV depuis LinkedIn Recruiter ou votre ATS. L'agent récupère automatiquement les données (mail et numéro)."
                delay={0}
              />
              <WorkflowStep
                number="02"
                icon={<Phone className="h-8 w-8" />}
                title="Contact automatique"
                description="L'agent IA contacte les candidats par e-mail et SMS pour confirmer leurs disponibilités en vue d'un premier échange téléphonique de 5 minutes de préqualification."
                delay={100}
              />
              <WorkflowStep
                number="03"
                icon={<CheckCircle2 className="h-8 w-8" />}
                title="Préqualification complète"
                description="L'agent mène l'entretien de préqualification à votre place (mobilité, rémunération, compétences nécessaires au poste, description du poste au candidat)."
                delay={200}
              />
              <WorkflowStep
                number="04"
                icon={<Calendar className="h-8 w-8" />}
                title="Planification automatique"
                description="Les profils de qualités reçoivent une proposition de RDV. L'agent synchronise votre calendrier automatiquement."
                delay={300}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="line-separator" />

      {/* Value Proposition Section */}
      <section id="avantages" className="py-24 bg-card">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div>
              <h2 className="font-display text-5xl tracking-tight mb-6">
                Remplacez les appels manuels par l'IA
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                La phase de préqualification est chronophage et répétitive. Notre agent IA la réalise mieux, 
                plus vite et à grande échelle, libérant vos équipes pour se concentrer sur les entretiens à forte valeur ajoutée.
              </p>
              
              <div className="space-y-6">
                <BenefitItem
                  icon={<Clock className="h-8 w-8 text-primary" />}
                  title="Gain de temps massif"
                  description="Ne perdez plus de temps à essayer de joindre les candidats. L'agent IA les contacte automatiquement en fonction de leur disponibilité."
                />
                <BenefitItem
                  icon={<DollarSign className="h-8 w-8 text-primary" />}
                  title="Réduction des coûts"
                  description="Divisez par 5 le coût de votre sourcing et préqualification"
                />
                <BenefitItem
                  icon={<TrendingUp className="h-8 w-8 text-primary" />}
                  title="Qualité supérieure"
                  description="Questions standardisées, scoring objectif, zéro biais humain"
                />
                <BenefitItem
                  icon={<Users className="h-8 w-8 text-primary" />}
                  title="Scalabilité illimitée"
                  description="L'agent peut traiter 100 appels en simultané"
                />
              </div>
            </div>
            

          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="line-separator" />

      {/* Integration Section */}
      <section id="integrations" className="py-24">
        <div className="container">
          <div>
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-5xl tracking-tight mb-6">
                Intégration transparente
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                HunterAI s'intègre parfaitement à vos outils existants. Importez vos candidats depuis n'importe quelle source 
                et synchronisez automatiquement vos calendriers.
              </p>
              
              <div className="space-y-4">
                <IntegrationItem text="Import CSV depuis LinkedIn Recruiter ou ATS" />
                <IntegrationItem text="Synchronisation calendrier (Google, Outlook)" />
                <IntegrationItem text="Connexion à votre CRM (sur demande)" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="line-separator" />

      {/* CTA Section */}
      <section id="demo" className="py-24 bg-foreground text-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-5xl tracking-tight mb-6">
              Prêt à trouver les meilleurs profls ?
            </h2>
            <p className="text-lg mb-8 opacity-90 leading-relaxed">
              Rejoignez les cabinets de recrutement et équipes RH qui ont déjà automatisé leur préqualification. 
              Inscrivez-vous à notre waitlist.
            </p>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-background/10 border-background/20 text-background placeholder:text-background/60 focus-visible:border-background/40 focus-visible:ring-background/20 flex-1"
                />
                <Button 
                  type="submit"
                  size="lg" 
                  className="h-12 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150 hover:scale-105 whitespace-nowrap"
                >
                  S'inscrire
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                <CheckCircle2 className="h-12 w-12 text-primary" />
                <p className="text-lg font-semibold">Merci !</p>
                <p className="text-sm opacity-90">Votre email a été enregistré avec succès.</p>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="font-display text-xl mb-4">HunterAI</div>
              <p className="text-sm text-muted-foreground">
                L'agent IA qui automatise vos appels de préqualification, concentrez-vous sur les candidats de qualités. 
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#integrations" className="hover:text-foreground transition-colors">Intégrations</a></li>
                <li><a href="#avantages" className="hover:text-foreground transition-colors">Avantages</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2025 HunterAI. Tous droits réservés.
          </div>
        </div>
      </footer>

      {/* Waitlist Modal */}
      <Dialog open={showWaitlistModal} onOpenChange={setShowWaitlistModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Rejoindre la waitlist</DialogTitle>
            <DialogDescription>
              Inscrivez-vous pour être parmi les premiers à accéder à HunterAI
            </DialogDescription>
          </DialogHeader>
          {waitlistSubmitted ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-12 w-12 text-primary mb-4" />
              <p className="text-lg font-semibold mb-2">Merci !</p>
              <p className="text-sm text-muted-foreground text-center">
                Vous avez été ajouté à la waitlist. Nous vous contacterons bientôt.
              </p>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                S'inscrire
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkflowStep({ 
  number, 
  icon, 
  title, 
  description, 
  delay 
}: { 
  number: string; 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  delay: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div 
      ref={ref}
      className={`${isVisible ? 'animate-slide-in-up' : 'opacity-0'}`}
    >
      <Card className="h-full border-border hover:border-primary transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="text-primary">{icon}</div>
            <div className="font-display text-4xl text-muted-foreground/20">{number}</div>
          </div>
          <h3 className="text-xl font-semibold mb-3">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function BenefitItem({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function IntegrationItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="text-foreground">{text}</span>
    </div>
  );
}


function UploadPage({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'upload' | 'google'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setStep('google');
    } else {
      alert('Veuillez sélectionner un fichier CSV');
    }
  };

  const handleGoogleAuth = async () => {
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

  // Écouter les changements d'authentification pour rediriger vers le dashboard
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setLocation('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <button
          onClick={onBack}
          className="mb-8 text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
        >
          ← Retour
        </button>

        {step === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <h1 className="font-display text-5xl tracking-tight mb-6">Importez votre liste de candidats</h1>
            <p className="text-lg text-muted-foreground mb-8">Téléchargez un fichier CSV contenant vos candidats depuis LinkedIn Recruiter</p>
            
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Glissez-déposez votre fichier CSV</h3>
              <p className="text-muted-foreground mb-4">ou cliquez pour parcourir</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        )}

        {step === 'google' && (
          <div className="max-w-2xl mx-auto">
            <h1 className="font-display text-5xl tracking-tight mb-6">Fichier reçu avec succès 🎉</h1>
            <p className="text-lg text-muted-foreground mb-8">Nous avons bien reçu votre fichier <strong>{file?.name}</strong>. Connectez-vous avec votre compte Google pour accéder aux avancés de votre recrutement avec notre agent IA.</p>
            
            <Card className="p-8">
              <div className="text-center">
                <Button 
                  size="lg" 
                  onClick={handleGoogleAuth} 
                  className="w-full py-7 text-lg flex gap-4 items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300 font-semibold"
                >
                  <Mail className="w-6 h-6" />
                  Continuer avec Google
                </Button>
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}