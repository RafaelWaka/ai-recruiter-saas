/**
 * Dashboard SaaS RecruiterAI
 * - Sidebar avec navigation et projets
 * - Vue principale avec liste des projets et bouton créer
 * - Design moderne type Notion/HubSpot
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FolderOpen, Settings, LogOut, ChevronRight, Upload, ArrowRight, ArrowLeft, CheckCircle2, MoreVertical, Trash2, Bot, Volume2, VolumeX, Settings as SettingsIcon, Mic, MicOff, MessageSquare } from "lucide-react";
import ProjectDetail from "./ProjectDetail";
import { supabase } from "../lib/supabase";

// Types pour la reconnaissance vocale
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface Window {
  SpeechRecognition: {
    new (): SpeechRecognition;
  };
  webkitSpeechRecognition: {
    new (): SpeechRecognition;
  };
}

interface Project {
  id: string;
  name: string;
  jobTitle: string;
  candidateCount: number;
  status: "active" | "completed";
  createdAt: string;
  progress: number;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showCreateFlow, setShowCreateFlow] = useState(false);

  // Données des projets
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Recrutement Développeurs React",
      jobTitle: "Senior React Developer",
      candidateCount: 45,
      status: "active",
      createdAt: "2025-01-15",
      progress: 65,
    },
    {
      id: "2",
      name: "Campagne Product Manager",
      jobTitle: "Product Manager B2B SaaS",
      candidateCount: 32,
      status: "active",
      createdAt: "2025-01-10",
      progress: 42,
    },
  ]);
  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setLocation('/');
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      setLocation('/'); // On force le retour même si erreur
    }
  };

  // Fonction pour supprimer un projet
  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${projectName}" ? Cette action est irréversible.`)) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (selectedProject === projectId) {
        setSelectedProject(null);
      }
    }
  };

  // Logique d'affichage du flux de création
  if (showCreateFlow) {
    return (
      <CreateProjectFlow
        onBack={() => setShowCreateFlow(false)}
        onComplete={(newProject) => {
          setShowCreateFlow(false);
          setProjects(prev => [...prev, newProject]);
          setSelectedProject(newProject.id);
        }}
      />
    );
  }

  // Logique d'affichage du détail d'un projet
  if (selectedProject) {
    const project = projects.find((p) => p.id === selectedProject);
    if (project) {
      return (
        <ProjectDetail
          project={project}
          onBack={() => setSelectedProject(null)}
          onDelete={(projectId) => {
            handleDeleteProject(projectId, project.name);
            setSelectedProject(null);
          }}
          onStopAgent={(projectId) => {
            setProjects(prev => prev.map(p => 
              p.id === projectId ? { ...p, status: 'completed' as const } : p
            ));
          }}
        />
      );
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="font-display text-2xl tracking-tight">HunterAI</h1>
          <p className="text-xs text-muted-foreground mt-1">Agent IA Recrutement</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Projets
            </p>
            <Button
              onClick={() => setShowCreateFlow(true)}
              className="w-full justify-start gap-2"
            >
              <Plus className="h-4 w-4" />
              Créer un projet
            </Button>
          </div>

          <div className="space-y-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors group flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm truncate">{project.name}</span>
                </div>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </Button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-lg transition-colors text-red-600"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Chasseur de tête AI */}
          <AIAssistant />
          
          <div className="mb-8 mt-8">
            <h2 className="font-display text-4xl tracking-tight mb-2">
              Mes projets
            </h2>
            <p className="text-muted-foreground">
              Gérez vos campagnes de recrutement automatisées
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="p-6 hover:shadow-lg transition-shadow relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {project.jobTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded">
                      {project.status === "active" ? "Actif" : "Terminé"}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id, project.name);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer le projet
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div 
                  className="space-y-4 cursor-pointer"
                  onClick={() => setSelectedProject(project.id)}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {project.candidateCount} candidats
                    </span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// Composant de flux de création de projet
function CreateProjectFlow({ 
  onBack, 
  onComplete 
}: { 
  onBack: () => void; 
  onComplete: (project: Project) => void;
}) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'brief'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<{
    nom: string;
    prenom: string;
    linkedin: string;
  }>({
    nom: '',
    prenom: '',
    linkedin: ''
  });
  const [brief, setBrief] = useState({
    nomProjet: '',
    poste: '',
    description: '',
    competences: '',
    experience: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      
      // Lire le CSV
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        setCsvHeaders(headers);
        
        // Parser les données
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        setCsvData(data);
        
        // Auto-mapping intelligent
        const autoMapping: any = {};
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('nom') && !lowerHeader.includes('prenom')) {
            autoMapping.nom = header;
          } else if (lowerHeader.includes('prenom') || lowerHeader.includes('prénom')) {
            autoMapping.prenom = header;
          } else if (lowerHeader.includes('linkedin') || lowerHeader.includes('linked')) {
            autoMapping.linkedin = header;
          }
        });
        setMapping(autoMapping);
        
        setStep('mapping');
      }
    } else {
      alert('Veuillez sélectionner un fichier CSV');
    }
  };

  const handleMappingNext = () => {
    if (!mapping.nom || !mapping.prenom || !mapping.linkedin) {
      alert('Veuillez mapper les trois colonnes : Nom, Prénom et LinkedIn');
      return;
    }
    setStep('brief');
  };

  const handleCreateProject = async () => {
    if (!brief.nomProjet || !brief.poste || !brief.description) {
      alert('Veuillez remplir tous les champs obligatoires du brief');
      return;
    }
    
    // Créer le projet
    const newProject: Project = {
      id: Date.now().toString(),
      name: brief.nomProjet,
      jobTitle: brief.poste,
      candidateCount: csvData.length,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      progress: 0,
    };
    
    // Ici, vous pourriez sauvegarder dans Supabase
    // await supabase.from('projects').insert({ 
    //   ...newProject, 
    //   brief, 
    //   mapping, 
    //   csvData 
    // });
    
    onComplete(newProject);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar simplifiée */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="font-display text-2xl tracking-tight">HunterAI</h1>
          <p className="text-xs text-muted-foreground mt-1">Agent IA Recrutement</p>
        </div>
        <div className="p-4">
          <Button variant="ghost" onClick={onBack} className="w-full justify-start gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-8">
          {/* Indicateur de progression */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {step !== 'upload' ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                </div>
                <span className="font-medium">Import CSV</span>
              </div>
              <div className={`flex-1 h-1 mx-2 ${step !== 'upload' ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`flex items-center gap-2 ${step === 'mapping' ? 'text-primary' : step === 'brief' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'mapping' ? 'bg-primary text-primary-foreground' : step === 'brief' ? 'bg-muted' : 'bg-muted'}`}>
                  {step === 'brief' ? <CheckCircle2 className="h-4 w-4" /> : '2'}
                </div>
                <span className="font-medium">Mapping</span>
              </div>
              <div className={`flex-1 h-1 mx-2 ${step === 'brief' ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`flex items-center gap-2 ${step === 'brief' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'brief' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  3
                </div>
                <span className="font-medium">Brief</span>
              </div>
            </div>
          </div>

          {/* Étape 1: Upload CSV */}
          {step === 'upload' && (
            <Card className="p-8">
              <div className="text-center">
                <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Importez votre fichier CSV</h2>
                <p className="text-muted-foreground mb-6">
                  Téléchargez votre fichier CSV contenant les candidats à qualifier
                </p>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-12 cursor-pointer hover:border-primary transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour sélectionner un fichier CSV
                  </p>
                  {file && (
                    <p className="text-sm text-primary mt-2">{file.name}</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Étape 2: Mapping */}
          {step === 'mapping' && (
            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-2">Mappez vos colonnes</h2>
              <p className="text-muted-foreground mb-6">
                Sélectionnez les colonnes correspondant à : Nom, Prénom et LinkedIn
              </p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nom *</label>
                  <select
                    value={mapping.nom}
                    onChange={(e) => setMapping({ ...mapping, nom: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">Sélectionnez une colonne</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Prénom *</label>
                  <select
                    value={mapping.prenom}
                    onChange={(e) => setMapping({ ...mapping, prenom: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">Sélectionnez une colonne</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">LinkedIn *</label>
                  <select
                    value={mapping.linkedin}
                    onChange={(e) => setMapping({ ...mapping, linkedin: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">Sélectionnez une colonne</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button onClick={handleMappingNext} className="flex-1">
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}

          {/* Étape 3: Brief */}
          {step === 'brief' && (
            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-2">Remplissez le brief de poste</h2>
              <p className="text-muted-foreground mb-6">
                Aidez l'agent IA à mieux comprendre le poste et qualifier les candidats
              </p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nom du projet *</label>
                  <Input
                    value={brief.nomProjet}
                    onChange={(e) => setBrief({ ...brief, nomProjet: e.target.value })}
                    placeholder="Ex: Recrutement Développeurs React"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Intitulé du poste *</label>
                  <Input
                    value={brief.poste}
                    onChange={(e) => setBrief({ ...brief, poste: e.target.value })}
                    placeholder="Ex: Senior React Developer"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Description du poste *</label>
                  <Textarea
                    value={brief.description}
                    onChange={(e) => setBrief({ ...brief, description: e.target.value })}
                    placeholder="Décrivez le poste, les responsabilités principales..."
                    rows={4}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Compétences requises</label>
                  <Textarea
                    value={brief.competences}
                    onChange={(e) => setBrief({ ...brief, competences: e.target.value })}
                    placeholder="Ex: React, TypeScript, Node.js, 5 ans d'expérience..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Expérience souhaitée</label>
                  <Input
                    value={brief.experience}
                    onChange={(e) => setBrief({ ...brief, experience: e.target.value })}
                    placeholder="Ex: 5+ ans dans le développement web"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('mapping')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button onClick={handleCreateProject} className="flex-1">
                  Créer le projet
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

// Composant Assistant IA Chasseur de tête
function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis votre chasseur de tête AI. Je suis là pour vous accompagner dans vos recrutements, analyser vos candidats et optimiser vos campagnes. Que souhaitez-vous faire aujourd\'hui ?'
    }
  ]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // 8 profils de voix prédéfinis pour un ton de recruteur naturel
  const [voiceProfiles, setVoiceProfiles] = useState<Array<{
    name: string;
    rate: number;
    pitch: number;
    volume: number;
    description: string;
    gender: 'male' | 'female';
    voiceIndex: number;
  }>>([]);

  const [voiceSettings, setVoiceSettings] = useState({
    profileIndex: 0,
    rate: 0.95,
    pitch: 1.0,
    volume: 0.9,
    voiceIndex: 0
  });
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [selectedVoiceForSequences, setSelectedVoiceForSequences] = useState<number | null>(null);

  // Initialiser la reconnaissance vocale
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialiser Speech Synthesis
      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
      }

      // Initialiser Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'fr-FR';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setTranscript(transcript);
          handleSend(transcript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Erreur de reconnaissance vocale:', event.error);
          setIsListening(false);
          if (event.error === 'no-speech') {
            alert('Aucune parole détectée. Veuillez réessayer.');
          } else if (event.error === 'not-allowed') {
            alert('Permission de microphone refusée. Veuillez autoriser l\'accès au microphone.');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }

      // Charger la voix sélectionnée depuis localStorage
      const savedVoice = localStorage.getItem('selectedVoiceForSequences');
      if (savedVoice) {
        setSelectedVoiceForSequences(parseInt(savedVoice));
      }
      
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Filtrer les voix françaises
        const frenchVoices = voices.filter(v => v.lang.startsWith('fr'));
        
        // Fonction pour détecter si une voix est féminine
        const isFemaleVoice = (voice: SpeechSynthesisVoice): boolean => {
          const name = voice.name.toLowerCase();
          return name.includes('france') || 
                 name.includes('french') ||
                 name.includes('thomas') === false && 
                 (name.includes('audrey') || name.includes('amelie') || name.includes('marie') || 
                  name.includes('sophie') || name.includes('claire') || name.includes('celine') ||
                  name.includes('female') || name.includes('femme') || name.includes('woman'));
        };

        // Fonction pour scorer la qualité d'une voix (éviter les voix robotiques)
        const scoreVoice = (voice: SpeechSynthesisVoice): number => {
          const name = voice.name.toLowerCase();
          let score = 0;
          
          // Prioriser les voix premium/enhanced
          if (name.includes('premium') || name.includes('enhanced') || name.includes('neural')) {
            score += 20;
          }
          
          // Prioriser les voix locales (généralement plus naturelles)
          if (voice.localService) {
            score += 15;
          }
          
          // Éviter les voix qui sonnent robotiques
          if (name.includes('compact') || name.includes('basic') || name.includes('standard')) {
            score -= 10;
          }
          
          // Prioriser certaines voix connues pour être naturelles
          if (name.includes('thomas') || name.includes('audrey') || name.includes('amelie') || 
              name.includes('marie') || name.includes('sophie') || name.includes('claire')) {
            score += 10;
          }
          
          return score;
        };

        // Séparer les voix masculines et féminines
        const maleVoices = frenchVoices
          .filter(v => !isFemaleVoice(v))
          .sort((a, b) => scoreVoice(b) - scoreVoice(a));
        
        const femaleVoices = frenchVoices
          .filter(v => isFemaleVoice(v))
          .sort((a, b) => scoreVoice(b) - scoreVoice(a));

        // Prendre 4 voix masculines et 4 voix féminines (ou équilibrer si pas assez)
        const selectedVoices: SpeechSynthesisVoice[] = [];
        const selectedIndices: number[] = [];
        
        // Prendre jusqu'à 4 voix masculines
        for (let i = 0; i < Math.min(4, maleVoices.length); i++) {
          selectedVoices.push(maleVoices[i]);
          selectedIndices.push(frenchVoices.indexOf(maleVoices[i]));
        }
        
        // Prendre jusqu'à 4 voix féminines
        for (let i = 0; i < Math.min(4, femaleVoices.length); i++) {
          selectedVoices.push(femaleVoices[i]);
          selectedIndices.push(frenchVoices.indexOf(femaleVoices[i]));
        }
        
        // Si on n'a pas 8 voix, compléter avec les meilleures restantes
        while (selectedVoices.length < 8 && selectedVoices.length < frenchVoices.length) {
          const remaining = frenchVoices.filter((v, idx) => !selectedIndices.includes(idx));
          if (remaining.length === 0) break;
          const best = remaining.sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
          selectedVoices.push(best);
          selectedIndices.push(frenchVoices.indexOf(best));
        }
        
        setAvailableVoices(selectedVoices);

        // Créer les 8 profils avec leurs voix associées
        const profiles = [
          { name: 'Voix Professionnelle Homme', rate: 0.95, pitch: 1.0, volume: 0.9, description: 'Ton confiant et rassurant', gender: 'male' as const },
          { name: 'Voix Professionnelle Femme', rate: 0.98, pitch: 1.05, volume: 0.9, description: 'Ton chaleureux et engageant', gender: 'female' as const },
          { name: 'Voix Dynamique Homme', rate: 1.02, pitch: 1.02, volume: 0.88, description: 'Ton énergique et motivant', gender: 'male' as const },
          { name: 'Voix Dynamique Femme', rate: 1.05, pitch: 1.08, volume: 0.87, description: 'Ton vif et réactif', gender: 'female' as const },
          { name: 'Voix Sereine Femme', rate: 0.92, pitch: 1.03, volume: 0.9, description: 'Ton calme et posé', gender: 'female' as const },
          { name: 'Voix Autoritaire Homme', rate: 0.95, pitch: 0.92, volume: 0.93, description: 'Ton décidé et direct', gender: 'male' as const },
          { name: 'Voix Convaincante Femme', rate: 1.0, pitch: 1.05, volume: 0.9, description: 'Ton persuasif et professionnel', gender: 'female' as const },
          { name: 'Voix Bienveillante Homme', rate: 0.94, pitch: 1.0, volume: 0.89, description: 'Ton empathique et à l\'écoute', gender: 'male' as const },
        ];

        // Associer chaque profil à une voix appropriée
        const profilesWithVoices = profiles.map((profile, index) => {
          // Trouver une voix correspondant au genre du profil
          let voiceIndex = 0;
          if (selectedVoices.length > 0) {
            if (profile.gender === 'female') {
              // Chercher une voix féminine
              const femaleIndex = selectedVoices.findIndex((v, idx) => 
                idx >= Math.min(4, maleVoices.length) || isFemaleVoice(v)
              );
              voiceIndex = femaleIndex >= 0 ? femaleIndex : index % selectedVoices.length;
            } else {
              // Chercher une voix masculine
              const maleIndex = selectedVoices.findIndex((v, idx) => 
                idx < Math.min(4, maleVoices.length) && !isFemaleVoice(v)
              );
              voiceIndex = maleIndex >= 0 ? maleIndex : index % selectedVoices.length;
            }
          }
          
          return {
            ...profile,
            voiceIndex: Math.min(voiceIndex, selectedVoices.length - 1)
          };
        });

        setVoiceProfiles(profilesWithVoices);
        
        // Initialiser avec le premier profil
        if (profilesWithVoices.length > 0) {
          setVoiceSettings({
            profileIndex: 0,
            rate: profilesWithVoices[0].rate,
            pitch: profilesWithVoices[0].pitch,
            volume: profilesWithVoices[0].volume,
            voiceIndex: profilesWithVoices[0].voiceIndex
          });
        }
      };
      
      loadVoices();
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Sauvegarder la voix sélectionnée pour les séquences
  const handleVoiceSelectionForSequences = (profileIndex: number) => {
    setSelectedVoiceForSequences(profileIndex);
    localStorage.setItem('selectedVoiceForSequences', profileIndex.toString());
    alert('Voix sélectionnée pour les séquences d\'appels de l\'agent IA !');
  };

  // Démarrer/arrêter l'écoute
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('La reconnaissance vocale n\'est pas disponible dans votre navigateur.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  // Mettre à jour les paramètres quand on change de profil
  const handleProfileChange = (profileIndex: number) => {
    if (voiceProfiles.length === 0) return;
    const profile = voiceProfiles[profileIndex];
    setVoiceSettings({
      profileIndex,
      rate: profile.rate,
      pitch: profile.pitch,
      volume: profile.volume,
      voiceIndex: profile.voiceIndex
    });
  };

  const speak = (text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (availableVoices.length > 0 && voiceSettings.voiceIndex < availableVoices.length) {
      utterance.voice = availableVoices[voiceSettings.voiceIndex];
    }
    
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;
    utterance.lang = 'fr-FR';
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSend = (text?: string) => {
    const messageText = text || transcript;
    if (!messageText.trim()) return;

    const userMessage = { role: 'user' as const, content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setTranscript('');

    // Simuler une réponse de l'IA avec le ton d'un recruteur (à remplacer par un vrai appel API)
    setTimeout(() => {
      const responses = [
        "Parfait, je comprends votre besoin. Laissez-moi analyser vos projets de recrutement en cours pour vous donner une vision claire de la situation.",
        "Excellente question. D'après mes données, vous avez actuellement plusieurs candidats en phase de qualification. Je peux vous détailler leur profil et leur niveau de match si vous le souhaitez.",
        "Très bien. Je peux vous accompagner pour optimiser votre processus de recrutement. Quels sont les points sur lesquels vous aimeriez progresser en priorité ?",
        "Parfait, je vais examiner vos campagnes actives et vous proposer des recommandations concrètes pour améliorer votre taux de conversion.",
        "Je vois. Pour mieux vous conseiller, pouvez-vous me préciser sur quel projet vous souhaitez vous concentrer ?",
        "D'accord. Je remarque que certains candidats nécessitent un suivi. Voulez-vous que je vous propose un plan d'action pour les relancer ?",
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      const assistantMessage = { role: 'assistant' as const, content: response };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Lire la réponse automatiquement
      speak(response);
    }, 500);
  };

  return (
    <div className="mb-8">
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Ton chasseur de tête AI</h3>
                <p className="text-sm text-muted-foreground">Assistant intelligent pour votre recrutement</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSpeaking && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopSpeaking}
                  className="gap-2"
                >
                  <VolumeX className="h-4 w-4" />
                  Arrêter
                </Button>
              )}
              <Button
                variant={showVoiceSettings ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                className="gap-2"
              >
                <SettingsIcon className="h-4 w-4" />
                Voix
              </Button>
              <Button
                variant={isOpen ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Discuter
              </Button>
            </div>
          </div>

          {showVoiceSettings && (
            <Card className="p-4 mb-4 bg-background">
              <h4 className="font-semibold text-sm mb-3">Choisissez votre voix de recruteur</h4>
              <div className="space-y-4">
                {voiceProfiles.length > 0 ? (
                  <>
                    <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-xs font-medium text-primary mb-2">Voix pour l'assistant (chat)</p>
                      <p className="text-xs text-muted-foreground">Sélectionnez la voix pour les réponses de l'assistant</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {voiceProfiles.map((profile, index) => {
                        const voice = availableVoices[profile.voiceIndex];
                        const isSelectedForChat = voiceSettings.profileIndex === index;
                        const isSelectedForSequences = selectedVoiceForSequences === index;
                        return (
                          <div key={index} className="relative">
                            <button
                              onClick={() => handleProfileChange(index)}
                              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                                isSelectedForChat
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-medium text-sm">{profile.name}</div>
                                <div className="flex items-center gap-1">
                                  {profile.gender === 'female' && (
                                    <span className="text-xs text-pink-600">♀</span>
                                  )}
                                  {profile.gender === 'male' && (
                                    <span className="text-xs text-blue-600">♂</span>
                                  )}
                                  {isSelectedForChat && (
                                    <span className="text-xs text-primary font-bold">Chat</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mb-1">{profile.description}</div>
                              {voice && (
                                <div className="text-xs text-muted-foreground italic">
                                  {voice.name}
                                </div>
                              )}
                            </button>
                            <Button
                              size="sm"
                              variant={isSelectedForSequences ? "default" : "outline"}
                              className="absolute top-2 right-2 h-6 text-xs px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVoiceSelectionForSequences(index);
                              }}
                            >
                              {isSelectedForSequences ? '✓ Sélectionné' : 'Sélectionner'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    {selectedVoiceForSequences !== null && (
                      <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-xs font-medium text-green-600">
                          ✓ Voix sélectionnée pour les séquences d'appels de l'agent IA
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cette voix sera utilisée lors des appels téléphoniques automatiques
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Chargement des voix...
                  </div>
                )}
              </div>
            </Card>
          )}

          {isOpen && (
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => speak(message.content)}
                        className="ml-2 h-8 w-8 p-0"
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {transcript && (
                  <div className="p-2 bg-muted rounded text-sm text-muted-foreground">
                    "{transcript}"
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={toggleListening}
                    variant={isListening ? "destructive" : "default"}
                    className="flex-1 gap-2"
                    disabled={!recognitionRef.current}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="h-4 w-4" />
                        Arrêter l'écoute
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        Parler
                      </>
                    )}
                  </Button>
                  {!recognitionRef.current && (
                    <p className="text-xs text-muted-foreground self-center">
                      La reconnaissance vocale n'est pas disponible
                    </p>
                  )}
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Cliquez sur "Parler" et posez votre question à l'oral
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}