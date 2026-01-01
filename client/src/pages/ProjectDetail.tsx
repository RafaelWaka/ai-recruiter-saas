/**
 * Détail d'un projet avec 4 onglets :
 * 1. Séquence IA
 * 2. Pipeline de candidats
 * 3. Préqualifiés / Retenus
 * 4. Rendez-vous planifiés
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  MessageSquare,
  Users,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  Clock,
  Download,
  Power,
  Trash2,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  jobTitle: string;
  candidateCount: number;
  status: "active" | "completed";
  createdAt: string;
  progress: number;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "imported" | "contacted" | "responded" | "joined" | "qualified" | "scheduled";
  score?: number;
  notes?: string;
  dateAdded?: string;
  dateContacted?: string;
  sequenceStage?: string;
  response?: string;
  responseType?: "email" | "sms";
  callAnswers?: { question: string; answer: string }[];
  scoreDetails?: { criteria: string; points: number; maxPoints: number }[];
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    imported: "Importé",
    contacted: "Contacté",
    responded: "Réponse reçue",
    joined: "Joint au téléphone",
    qualified: "Préqualifié",
    scheduled: "RDV planifié",
  };
  return labels[status] || status;
}

function exportToExcel(candidates: Candidate[], jobTitle: string) {
  // Créer les données pour l'export
  const data = candidates.map((c) => ({
    Nom: c.name,
    Email: c.email,
    Téléphone: c.phone,
    Entreprise: c.company,
    Statut: getStatusLabel(c.status),
    "Score de match": c.score || "-",
    "Résumé de l'appel": c.notes || "-",
  }));

  // Convertir en CSV
  const headers = Object.keys(data[0] || {});
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof typeof row];
          return typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value;
        })
        .join(",")
    ),
  ].join("\n");

  // Télécharger le fichier
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `candidats_${jobTitle.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.click();
}

export default function ProjectDetail({
  project,
  onBack,
  onDelete,
  onStopAgent,
}: {
  project: Project;
  onBack: () => void;
  onDelete?: (projectId: string) => void;
  onStopAgent?: (projectId: string) => void;
}) {
  const [isAgentActive, setIsAgentActive] = useState(project.status === "active");
  
  // Messages éditables
  const [messages, setMessages] = useState({
    email1: {
      subject: `Opportunité de carrière en tant que ${project.jobTitle}`,
      content: `Bonjour [Prénom],

Je me permets ce message dans le cadre d'une offre d'emploi que je souhaite vous soumettre.

C'est une très belle offre de ${project.jobTitle},

A quel numéro puis je vous joindre et à quelle heure ?
Cordialement

PS : Je suis l'agent AI de Rafael Debucquet, ce première échange ne durera que 5 minutes afin de vous poser des questions de préqualifications et de savoir si ce poste peut vous intéressser.`
    },
    sms1: {
      content: `Bonjour [Prénom],

Je me permets ce message dans le cadre d'une offre d'emploi que je souhaite vous soumettre.

C'est une très belle offre de ${project.jobTitle},

A quel numéro puis je vous joindre et à quelle heure ?
Cordialement

PS : Je suis l'agent AI de Rafael Debucquet, ce première échange ne durera que 5 minutes afin de vous poser des questions de préqualifications et de savoir si ce poste peut vous intéressser.`
    },
    call: {
      questions: [
        "Êtes-vous toujours en poste ?",
        "Habitez-vous bien dans la région ?",
        "Quel est votre niveau de rémunération et vos prétentions salariales ?",
        "Quel est votre niveau d'anglais ?",
        "Combien de personnes managez-vous ?"
      ]
    }
  });

  // États d'édition
  const [editing, setEditing] = useState<{
    type: 'email1' | 'sms1' | 'call' | null;
    field?: 'subject' | 'content' | 'questions';
  }>({ type: null });
  
  const [canEditToday, setCanEditToday] = useState(true);
  const [lastEditDate, setLastEditDate] = useState<string | null>(null);

  // Vérifier si l'utilisateur peut éditer aujourd'hui
  useEffect(() => {
    const storageKey = `lastEdit_${project.id}`;
    const lastEdit = localStorage.getItem(storageKey);
    const today = new Date().toDateString();
    
    if (lastEdit === today) {
      setCanEditToday(false);
      setLastEditDate(lastEdit);
    } else {
      setCanEditToday(true);
      setLastEditDate(null);
    }
  }, [project.id]);

  const handleStartEdit = (type: 'email1' | 'sms1' | 'call', field?: 'subject' | 'content' | 'questions') => {
    if (!canEditToday) {
      alert("Vous avez déjà modifié les messages aujourd'hui. Vous pourrez les modifier à nouveau demain pour éviter de perturber l'agent IA.");
      return;
    }
    setEditing({ type, field });
  };

  const handleSaveEdit = () => {
    const storageKey = `lastEdit_${project.id}`;
    const today = new Date().toDateString();
    localStorage.setItem(storageKey, today);
    setCanEditToday(false);
    setLastEditDate(today);
    setEditing({ type: null });
    // Ici vous pourriez sauvegarder dans Supabase
    alert("Messages modifiés avec succès. Ces modifications seront prises en compte par l'agent IA.");
  };

  const handleCancelEdit = () => {
    setEditing({ type: null });
  };

  const [expandedScore, setExpandedScore] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedVoiceForSequences, setSelectedVoiceForSequences] = useState<number | null>(null);
  
  // Charger la voix sélectionnée pour les séquences
  useEffect(() => {
    const savedVoice = localStorage.getItem('selectedVoiceForSequences');
    if (savedVoice) {
      setSelectedVoiceForSequences(parseInt(savedVoice));
    }
  }, []);
  
  // Initialiser les candidats
  const initialCandidates: Candidate[] = [
    {
      id: "1",
      name: "Alice Dupont",
      email: "alice.dupont@email.com",
      phone: "+33612345678",
      company: "TechCorp",
      status: "joined",
      score: 92,
      notes: "Excellente expérience React, disponible immédiatement",
      dateAdded: "2025-01-15",
      dateContacted: "2025-01-15",
      sequenceStage: "Appel téléphonique terminé",
      callAnswers: [
        { question: "Êtes-vous toujours en poste ?", answer: "Oui, je suis actuellement en poste mais je cherche une nouvelle opportunité." },
        { question: "Habitez-vous bien dans la région ?", answer: "Oui, j'habite à Paris, c'est parfait pour moi." },
        { question: "Quel est votre niveau de rémunération et vos prétentions salariales ?", answer: "Actuellement à 65k€, je cherche entre 70-75k€." },
        { question: "Quel est votre niveau d'anglais ?", answer: "Bilingue, j'ai travaillé 3 ans à Londres." },
        { question: "Combien de personnes managez-vous ?", answer: "J'encadre une équipe de 5 développeurs." }
      ],
      scoreDetails: [
        { criteria: "Expérience technique", points: 25, maxPoints: 25 },
        { criteria: "Niveau d'anglais", points: 20, maxPoints: 20 },
        { criteria: "Expérience managériale", points: 18, maxPoints: 20 },
        { criteria: "Disponibilité", points: 15, maxPoints: 15 },
        { criteria: "Prétentions salariales", points: 14, maxPoints: 20 }
      ]
    },
    {
      id: "2",
      name: "Bob Martin",
      email: "bob.martin@email.com",
      phone: "+33687654321",
      company: "StartupXYZ",
      status: "qualified",
      score: 85,
      notes: "Bon match, légèrement junior mais très motivé",
      dateAdded: "2025-01-14",
      dateContacted: "2025-01-14",
      sequenceStage: "Appel téléphonique terminé",
      callAnswers: [
        { question: "Êtes-vous toujours en poste ?", answer: "Oui, je suis en poste mais ouvert à de nouvelles opportunités." },
        { question: "Habitez-vous bien dans la région ?", answer: "Oui, j'habite en région parisienne." },
        { question: "Quel est votre niveau de rémunération et vos prétentions salariales ?", answer: "Actuellement à 55k€, je cherche autour de 60-65k€." },
        { question: "Quel est votre niveau d'anglais ?", answer: "Bon niveau, je peux communiquer professionnellement." },
        { question: "Combien de personnes managez-vous ?", answer: "Je ne manage pas encore d'équipe, mais j'ai encadré des stagiaires." }
      ],
      scoreDetails: [
        { criteria: "Expérience technique", points: 22, maxPoints: 25 },
        { criteria: "Niveau d'anglais", points: 16, maxPoints: 20 },
        { criteria: "Expérience managériale", points: 8, maxPoints: 20 },
        { criteria: "Disponibilité", points: 15, maxPoints: 15 },
        { criteria: "Prétentions salariales", points: 18, maxPoints: 20 }
      ]
    },
    {
      id: "3",
      name: "Carol Leclerc",
      email: "carol.leclerc@email.com",
      phone: "+33698765432",
      company: "WebAgency",
      status: "contacted",
      score: 0,
      notes: "",
      dateAdded: "2025-01-16",
      dateContacted: "2025-01-16",
      sequenceStage: "Email 1 envoyé",
    },
    {
      id: "4",
      name: "David Bernard",
      email: "david.bernard@email.com",
      phone: "+33611111111",
      company: "DataCorp",
      status: "responded",
      score: 0,
      notes: "",
      dateAdded: "2025-01-15",
      dateContacted: "2025-01-15",
      sequenceStage: "SMS 1 envoyé",
      response: "Bonjour, oui je suis intéressé. Je suis disponible cette semaine.",
      responseType: "sms",
    },
    {
      id: "5",
      name: "Emma Dubois",
      email: "emma.dubois@email.com",
      phone: "+33622222222",
      company: "CloudTech",
      status: "responded",
      score: 0,
      notes: "",
      dateAdded: "2025-01-14",
      dateContacted: "2025-01-14",
      sequenceStage: "Email 1 envoyé",
      response: "Merci pour votre message. Je serais ravie d'en discuter. Vous pouvez m'appeler au 06 22 22 22 22 entre 14h et 18h.",
      responseType: "email",
    },
    {
      id: "6",
      name: "François Moreau",
      email: "francois.moreau@email.com",
      phone: "+33633333333",
      company: "DevStudio",
      status: "imported",
      score: 0,
      notes: "",
      dateAdded: "2025-01-17",
      dateContacted: undefined,
      sequenceStage: "En attente",
    },
    {
      id: "7",
      name: "Gabrielle Petit",
      email: "gabrielle.petit@email.com",
      phone: "+33644444444",
      company: "TechStart",
      status: "contacted",
      score: 0,
      notes: "",
      dateAdded: "2025-01-16",
      dateContacted: "2025-01-16",
      sequenceStage: "SMS 1 envoyé",
    },
    {
      id: "8",
      name: "Hugo Leroy",
      email: "hugo.leroy@email.com",
      phone: "+33655555555",
      company: "InnovateLab",
      status: "responded",
      score: 0,
      notes: "",
      dateAdded: "2025-01-15",
      dateContacted: "2025-01-15",
      sequenceStage: "Email 1 envoyé",
      response: "Désolé, je ne suis pas intéressé pour le moment.",
      responseType: "email",
    },
    {
      id: "9",
      name: "Isabelle Roux",
      email: "isabelle.roux@email.com",
      phone: "+33666666666",
      company: "CodeFactory",
      status: "qualified",
      score: 78,
      notes: "Bonne expérience, à confirmer disponibilité",
      dateAdded: "2025-01-14",
      dateContacted: "2025-01-14",
      sequenceStage: "Appel téléphonique terminé",
      callAnswers: [
        { question: "Êtes-vous toujours en poste ?", answer: "Oui, je suis en poste." },
        { question: "Habitez-vous bien dans la région ?", answer: "Oui, j'habite à Lyon." },
        { question: "Quel est votre niveau de rémunération et vos prétentions salariales ?", answer: "Actuellement à 60k€, je cherche 65-70k€." },
        { question: "Quel est votre niveau d'anglais ?", answer: "Niveau intermédiaire, je peux lire et écrire mais l'oral est plus difficile." },
        { question: "Combien de personnes managez-vous ?", answer: "J'encadre 2 développeurs juniors." }
      ],
      scoreDetails: [
        { criteria: "Expérience technique", points: 20, maxPoints: 25 },
        { criteria: "Niveau d'anglais", points: 12, maxPoints: 20 },
        { criteria: "Expérience managériale", points: 12, maxPoints: 20 },
        { criteria: "Disponibilité", points: 12, maxPoints: 15 },
        { criteria: "Prétentions salariales", points: 16, maxPoints: 20 }
      ]
    },
    {
      id: "10",
      name: "Julien Blanc",
      email: "julien.blanc@email.com",
      phone: "+33677777777",
      company: "AppWorks",
      status: "scheduled",
      score: 88,
      notes: "RDV planifié pour le 20/01",
      dateAdded: "2025-01-13",
      dateContacted: "2025-01-13",
      sequenceStage: "Appel téléphonique terminé",
    },
  ];

  const [candidatesList, setCandidatesList] = useState<Candidate[]>(initialCandidates);

  // Fonction pour importer de nouveaux candidats
  const handleImportCandidates = (newCandidates: Candidate[]) => {
    setCandidatesList(prev => [...prev, ...newCandidates]);
    setShowImportModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "joined":
        return "bg-green-100 text-green-800";
      case "qualified":
        return "bg-blue-100 text-blue-800";
      case "responded":
        return "bg-yellow-100 text-yellow-800";
      case "contacted":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux projets
            </button>
            <div className="flex items-center gap-2">
              {isAgentActive && onStopAgent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Êtes-vous sûr de vouloir arrêter l'agent IA ? Il ne pourra plus contacter de nouveaux candidats.")) {
                      setIsAgentActive(false);
                      onStopAgent(project.id);
                    }
                  }}
                  className="gap-2"
                >
                  <Power className="h-4 w-4" />
                  Arrêter l'agent IA
                </Button>
              )}
              {!isAgentActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAgentActive(true);
                    // Ici vous pourriez appeler une API pour redémarrer l'agent
                  }}
                  className="gap-2"
                >
                  <Power className="h-4 w-4" />
                  Redémarrer l'agent IA
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ? Cette action est irréversible.`)) {
                      onDelete(project.id);
                    }
                  }}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground mt-1">{project.jobTitle}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Tabs defaultValue="sequence" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="sequence" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Séquence IA</span>
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </TabsTrigger>
            <TabsTrigger value="qualified" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Qualifiés</span>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">RDV</span>
            </TabsTrigger>
          </TabsList>

          {/* Séquence IA */}
          <TabsContent value="sequence" className="mt-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">
                  Timeline de la séquence d'outreach
                </h2>
                {!canEditToday && (
                  <p className="text-sm text-muted-foreground">
                    Modifications disponibles demain
                  </p>
                )}
              </div>
              
              {selectedVoiceForSequences !== null && (
                <Card className="p-4 bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">
                      Voix sélectionnée pour les appels téléphoniques : Profil {selectedVoiceForSequences + 1}
                    </p>
                    <p className="text-xs text-muted-foreground ml-2">
                      (Modifiable depuis l'assistant IA dans le Dashboard)
                    </p>
                  </div>
                </Card>
              )}
              
              {selectedVoiceForSequences === null && (
                <Card className="p-4 bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-600">
                      Aucune voix sélectionnée pour les séquences d'appels
                    </p>
                    <p className="text-xs text-muted-foreground ml-2">
                      Sélectionnez une voix depuis l'assistant IA dans le Dashboard
                    </p>
                  </div>
                </Card>
              )}
              
              <div className="space-y-4">
                <Card className="p-6 border-l-4 border-l-primary">
                  <div className="flex items-start gap-4">
                    <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Email 1 - Jour 0</h3>
                        {!editing.type && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit('email1')}
                            disabled={!canEditToday}
                            className="gap-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            Modifier
                          </Button>
                        )}
                      </div>
                      {editing.type === 'email1' ? (
                        <div className="space-y-3 mt-2">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Objet</label>
                            <Input
                              value={messages.email1.subject}
                              onChange={(e) => setMessages({
                                ...messages,
                                email1: { ...messages.email1, subject: e.target.value }
                              })}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Contenu</label>
                            <Textarea
                              value={messages.email1.content}
                              onChange={(e) => setMessages({
                                ...messages,
                                email1: { ...messages.email1, content: e.target.value }
                              })}
                              rows={4}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit} className="gap-2">
                              <Save className="h-4 w-4" />
                              Enregistrer
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit} className="gap-2">
                              <X className="h-4 w-4" />
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground mt-1">
                            Objet : {messages.email1.subject}
                          </p>
                          <p className="text-sm mt-2 bg-muted p-3 rounded">
                            "{messages.email1.content}"
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-blue-500">
                  <div className="flex items-start gap-4">
                    <MessageSquare className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">SMS 1 - Jour 1</h3>
                        {!editing.type && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit('sms1')}
                            disabled={!canEditToday}
                            className="gap-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            Modifier
                          </Button>
                        )}
                      </div>
                      {editing.type === 'sms1' ? (
                        <div className="space-y-3 mt-2">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Message SMS</label>
                            <Textarea
                              value={messages.sms1.content}
                              onChange={(e) => setMessages({
                                ...messages,
                                sms1: { content: e.target.value }
                              })}
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit} className="gap-2">
                              <Save className="h-4 w-4" />
                              Enregistrer
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit} className="gap-2">
                              <X className="h-4 w-4" />
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground mt-1">
                            Relance personnalisée
                          </p>
                          <p className="text-sm mt-2 bg-muted p-3 rounded">
                            "{messages.sms1.content}"
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-green-500">
                  <div className="flex items-start gap-4">
                    <Phone className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Appel téléphonique - Jour 2</h3>
                        {!editing.type && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit('call')}
                            disabled={!canEditToday}
                            className="gap-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            Modifier
                          </Button>
                        )}
                      </div>
                      {editing.type === 'call' ? (
                        <div className="space-y-3 mt-2">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Questions de préqualification</label>
                            {messages.call.questions.map((question, index) => (
                              <div key={index} className="mb-2">
                                <Input
                                  value={question}
                                  onChange={(e) => {
                                    const newQuestions = [...messages.call.questions];
                                    newQuestions[index] = e.target.value;
                                    setMessages({
                                      ...messages,
                                      call: { questions: newQuestions }
                                    });
                                  }}
                                  placeholder={`Question ${index + 1}`}
                                  className="mb-2"
                                />
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMessages({
                                  ...messages,
                                  call: { questions: [...messages.call.questions, ''] }
                                });
                              }}
                              className="mt-2"
                            >
                              + Ajouter une question
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit} className="gap-2">
                              <Save className="h-4 w-4" />
                              Enregistrer
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit} className="gap-2">
                              <X className="h-4 w-4" />
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground mt-1">
                            Préqualification automatique
                          </p>
                          <div className="text-sm mt-2 bg-muted p-3 rounded space-y-2">
                            <p>
                              <strong>Questions :</strong>
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              {messages.call.questions.map((question, index) => (
                                <li key={index}>{question}</li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Pipeline */}
          <TabsContent value="pipeline" className="mt-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Pipeline Kanban</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowImportModal(true)}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Importer nouveaux contacts
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportToExcel(candidatesList, project.jobTitle)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {["imported", "contacted", "responded", "joined"].map(
                  (status) => (
                    <div key={status} className="bg-muted rounded-lg p-4">
                      <h3 className="font-semibold text-sm mb-4">
                        {getStatusLabel(status)}
                        {status === "joined" && " (voir dans qualifiés)"}
                      </h3>
                      <div className="space-y-3">
                        {candidatesList
                          .filter((c) => c.status === status)
                          .map((candidate) => (
                            <Card
                              key={candidate.id}
                              className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                            >
                              <p className="font-medium text-sm mb-2">
                                {candidate.name}
                              </p>
                              <p className="text-xs text-muted-foreground mb-2">
                                {candidate.company}
                              </p>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                {candidate.dateAdded && (
                                  <p>Ajouté : {new Date(candidate.dateAdded).toLocaleDateString('fr-FR')}</p>
                                )}
                                {candidate.dateContacted && (
                                  <p>Contacté : {new Date(candidate.dateContacted).toLocaleDateString('fr-FR')}</p>
                                )}
                                {candidate.sequenceStage && status !== "responded" && (
                                  <p className="text-primary font-medium">Stade : {candidate.sequenceStage}</p>
                                )}
                                {status === "responded" && candidate.response && (
                                  <div className="mt-2 pt-2 border-t border-border">
                                    <p className="text-xs font-medium mb-1">
                                      Réponse {candidate.responseType === "email" ? "Email" : "SMS"} :
                                    </p>
                                    <p className="text-xs italic bg-background p-2 rounded">
                                      "{candidate.response}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </TabsContent>

          {/* Préqualifiés */}
          <TabsContent value="qualified" className="mt-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Candidats Préqualifiés</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToExcel(candidatesList.filter(c => c.status === "qualified"), project.jobTitle)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <div className="space-y-4">
                {candidatesList
                  .filter((c) => c.status === "qualified")
                  .map((candidate) => (
                    <Card key={candidate.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{candidate.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {candidate.company}
                          </p>
                        </div>
                        <div className="text-right">
                          <button
                            onClick={() => setExpandedScore(expandedScore === candidate.id ? null : candidate.id)}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <div className="text-2xl font-bold text-primary flex items-center gap-2">
                              {candidate.score}
                              {expandedScore === candidate.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Score de match (cliquez pour détails)
                            </p>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{candidate.email}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Téléphone</p>
                          <p className="font-medium">{candidate.phone}</p>
                        </div>
                      </div>
                      {expandedScore === candidate.id && candidate.scoreDetails && (
                        <div className="bg-primary/5 border border-primary/20 p-4 rounded mb-4">
                          <h4 className="font-semibold text-sm mb-3">Détails du score</h4>
                          <div className="space-y-2">
                            {candidate.scoreDetails.map((detail, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{detail.criteria}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-muted rounded-full h-2">
                                    <div
                                      className="bg-primary h-2 rounded-full"
                                      style={{ width: `${(detail.points / detail.maxPoints) * 100}%` }}
                                    />
                                  </div>
                                  <span className="font-medium w-12 text-right">
                                    {detail.points}/{detail.maxPoints}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="bg-muted p-3 rounded text-sm">
                        <p className="text-muted-foreground mb-2 font-medium">
                          Résumé de l'appel :
                        </p>
                        {candidate.callAnswers && candidate.callAnswers.length > 0 ? (
                          <div className="space-y-3">
                            {candidate.callAnswers.map((qa, index) => (
                              <div key={index} className="border-l-2 border-primary pl-3">
                                <p className="font-medium text-xs mb-1">{qa.question}</p>
                                <p className="text-xs text-muted-foreground italic">"{qa.answer}"</p>
                              </div>
                            ))}
                            {candidate.notes && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs text-muted-foreground italic">{candidate.notes}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p>{candidate.notes || "Aucun résumé disponible"}</p>
                        )}
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* Rendez-vous planifiés */}
          <TabsContent value="scheduled" className="mt-8">
            <div className="space-y-6">
              <h2 className="font-semibold text-lg">Rendez-vous Planifiés</h2>
              <div className="space-y-4">
                {candidatesList
                  .filter((c) => c.status === "scheduled")
                  .map((candidate) => (
                    <Card key={candidate.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{candidate.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {candidate.company}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Confirmé
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date/Heure</p>
                          <p className="font-medium">
                            15 février 2025 à 14h00
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium">Entretien téléphonique</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                {candidatesList.filter((c) => c.status === "scheduled").length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      Aucun rendez-vous planifié pour le moment
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal d'import de nouveaux contacts */}
      {showImportModal && (
        <ImportCandidatesModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportCandidates}
        />
      )}
    </div>
  );
}

// Composant modal pour importer de nouveaux candidats
function ImportCandidatesModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (candidates: Candidate[]) => void;
}) {
  const [step, setStep] = useState<'upload' | 'mapping'>('upload');
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        setCsvHeaders(headers);
        
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

  const handleImport = () => {
    if (!mapping.nom || !mapping.prenom || !mapping.linkedin) {
      alert('Veuillez mapper les trois colonnes : Nom, Prénom et LinkedIn');
      return;
    }

    const newCandidates: Candidate[] = csvData.map((row, index) => ({
      id: `imported_${Date.now()}_${index}`,
      name: `${row[mapping.prenom] || ''} ${row[mapping.nom] || ''}`.trim(),
      email: row.email || '',
      phone: row.phone || row.telephone || '',
      company: row.company || row.entreprise || '',
      status: 'imported' as const,
      dateAdded: new Date().toISOString().split('T')[0],
      sequenceStage: 'En attente',
    }));

    onImport(newCandidates);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Importer de nouveaux contacts</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-12 cursor-pointer hover:border-primary transition-colors text-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Cliquez pour sélectionner un fichier CSV
                </p>
                {file && (
                  <p className="text-sm text-primary mt-2">{file.name}</p>
                )}
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Sélectionnez les colonnes correspondant à : Nom, Prénom et LinkedIn
              </p>
              
              <div className="space-y-4">
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

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                  Retour
                </Button>
                <Button onClick={handleImport} className="flex-1">
                  Importer {csvData.length} contact{csvData.length > 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
