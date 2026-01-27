import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Activity, 
  AlertCircle, 
  Calendar,
  ClipboardList,
  Plus,
  ChevronDown,
  Settings,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScaleRegistrationDialog } from "@/components/ScaleRegistrationDialog";
import { EventTimeline } from "@/components/EventTimeline";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";

// Mock data - En producción vendría de la base de datos
const mockBedData = {
  "cama-101": {
    bedName: "Cama 101",
    patientName: "María González",
    patientAge: 68,
    diagnosis: "Neumonía adquirida en la comunidad",
    admissionDate: new Date("2024-11-15"),
    scales: [
      { label: "Glasgow", value: 15, maxValue: 15, date: new Date() },
      { label: "Norton", value: 18, maxValue: 20, date: new Date() },
      { label: "Morse", value: 45, maxValue: 125, date: new Date() },
      { label: "Downton", value: 2, maxValue: 11, date: new Date() },
    ],
    risks: {
      fallRisk: "medium" as const,
      extubationRisk: "low" as const,
      pressureInjuryRisk: "medium" as const,
    },
    clinicalFactors: {
      intubated: false,
      sedated: false,
      agitated: true,
      limitedMobility: true,
    },
    clinicalNotes: [
      { id: "1", content: "Paciente presenta mejoría en saturación de oxígeno. Se mantiene con O2 por cánula nasal.", date: new Date("2024-11-20T14:30:00"), author: "Enf. García" },
      { id: "2", content: "Se realiza cambio de posición cada 2 horas según protocolo.", date: new Date("2024-11-20T12:00:00"), author: "Enf. López" },
      { id: "3", content: "Paciente refiere dolor leve en región lumbar. Se administra analgésico según indicación.", date: new Date("2024-11-20T08:00:00"), author: "Enf. Martínez" },
      { id: "4", content: "Signos vitales estables durante la noche. Sin eventos adversos.", date: new Date("2024-11-19T22:00:00"), author: "Enf. Rodríguez" },
      { id: "5", content: "Se inicia rehabilitación respiratoria con kinesiólogo.", date: new Date("2024-11-19T16:00:00"), author: "Klgo. Fernández" },
    ],
  },
  "cama-102": {
    bedName: "Cama 102",
    patientName: "Juan Pérez",
    patientAge: 52,
    diagnosis: "Post-operatorio cirugía cardíaca",
    admissionDate: new Date("2024-11-18"),
    scales: [
      { label: "Glasgow", value: 14, maxValue: 15, date: new Date() },
      { label: "Norton", value: 16, maxValue: 20, date: new Date() },
      { label: "Morse", value: 65, maxValue: 125, date: new Date() },
      { label: "Downton", value: 4, maxValue: 11, date: new Date() },
    ],
    risks: {
      fallRisk: "high" as const,
      extubationRisk: "high" as const,
      pressureInjuryRisk: "low" as const,
    },
    clinicalFactors: {
      intubated: true,
      sedated: true,
      agitated: false,
      limitedMobility: true,
    },
    clinicalNotes: [
      { id: "1", content: "Post-operatorio inmediato estable. Paciente bajo sedación.", date: new Date("2024-11-20T10:00:00"), author: "Dr. Sánchez" },
      { id: "2", content: "Se mantiene monitoreo continuo. Drenajes con débito esperado.", date: new Date("2024-11-19T18:00:00"), author: "Enf. García" },
    ],
  },
};

interface ClinicalFactorOption {
  id: string;
  label: string;
  enabled: boolean;
}

const defaultFactorOptions: ClinicalFactorOption[] = [
  { id: "intubated", label: "Entubado", enabled: true },
  { id: "sedated", label: "Sedado", enabled: true },
  { id: "agitated", label: "Agitado", enabled: true },
  { id: "limitedMobility", label: "Movilidad Limitada", enabled: true },
];

const getRiskColor = (risk: "low" | "medium" | "high") => {
  switch (risk) {
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  }
};

const getRiskLabel = (risk: "low" | "medium" | "high") => {
  switch (risk) {
    case "low":
      return "Bajo";
    case "medium":
      return "Medio";
    case "high":
      return "Alto";
  }
};

const BedDetail = () => {
  const { bedId } = useParams();
  const navigate = useNavigate();
  const [scaleDialogOpen, setScaleDialogOpen] = useState(false);
  const [selectedScale, setSelectedScale] = useState<string>("");
  const [newNote, setNewNote] = useState("");
  const [visibleNotes, setVisibleNotes] = useState(20);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [newFactorLabel, setNewFactorLabel] = useState("");
  const [factorOptions, setFactorOptions] = useState<ClinicalFactorOption[]>(defaultFactorOptions);
  const [clinicalFactors, setClinicalFactors] = useState<Record<string, boolean>>({
    intubated: false,
    sedated: false,
    agitated: false,
    limitedMobility: false,
  });

  const bedData = mockBedData[bedId as keyof typeof mockBedData];

  // Initialize clinical factors from bed data
  useState(() => {
    if (bedData) {
      setClinicalFactors(bedData.clinicalFactors);
    }
  });

  if (!bedData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Cama no encontrada</CardTitle>
            <CardDescription>
              No se encontró información para esta cama
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysHospitalized = differenceInDays(new Date(), bedData.admissionDate);

  const handleRegisterScale = (scaleName: string) => {
    setSelectedScale(scaleName);
    setScaleDialogOpen(true);
  };

  const handleFactorChange = (factorId: string) => {
    setClinicalFactors(prev => ({
      ...prev,
      [factorId]: !prev[factorId]
    }));
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      // En producción, esto se enviaría a la base de datos
      console.log("Nueva nota:", newNote);
      setNewNote("");
    }
  };

  const handleLoadMoreNotes = () => {
    setVisibleNotes(prev => prev + 20);
  };

  const handleAddFactor = () => {
    if (newFactorLabel.trim()) {
      const newId = newFactorLabel.toLowerCase().replace(/\s+/g, '_');
      setFactorOptions(prev => [
        ...prev,
        { id: newId, label: newFactorLabel.trim(), enabled: true }
      ]);
      setClinicalFactors(prev => ({
        ...prev,
        [newId]: false
      }));
      setNewFactorLabel("");
    }
  };

  const handleRemoveFactor = (factorId: string) => {
    setFactorOptions(prev => prev.filter(f => f.id !== factorId));
    setClinicalFactors(prev => {
      const newFactors = { ...prev };
      delete newFactors[factorId];
      return newFactors;
    });
  };

  const displayedNotes = bedData.clinicalNotes.slice(0, visibleNotes);
  const hasMoreNotes = bedData.clinicalNotes.length > visibleNotes;
  const enabledFactors = factorOptions.filter(f => f.enabled);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {bedData.bedName}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {bedData.patientName} - {bedData.patientAge} años
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {daysHospitalized} día{daysHospitalized !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Desde {format(bedData.admissionDate, "dd MMM yyyy", { locale: es })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - 35% (reduced 10% from ~45%) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Patient Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Paciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Diagnóstico Principal
                    </p>
                    <p className="text-base font-medium text-foreground">
                      {bedData.diagnosis}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Riesgo de Caída
                      </p>
                      <Badge className={getRiskColor(bedData.risks.fallRisk)}>
                        {getRiskLabel(bedData.risks.fallRisk)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Riesgo Autoextubación
                      </p>
                      <Badge className={getRiskColor(bedData.risks.extubationRisk)}>
                        {getRiskLabel(bedData.risks.extubationRisk)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Lesión por Presión
                      </p>
                      <Badge className={getRiskColor(bedData.risks.pressureInjuryRisk)}>
                        {getRiskLabel(bedData.risks.pressureInjuryRisk)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clinical Factors - Moved below Patient Info */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Factores Clínicos Relevantes</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfigDialogOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {enabledFactors.map((factor) => (
                    <div key={factor.id} className="flex items-center space-x-3">
                      <Switch
                        id={factor.id}
                        checked={clinicalFactors[factor.id] || false}
                        onCheckedChange={() => handleFactorChange(factor.id)}
                      />
                      <Label htmlFor={factor.id} className="text-sm font-medium cursor-pointer">
                        {factor.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Event Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Línea de Tiempo de Eventos
                </CardTitle>
                <CardDescription>
                  Historial de eventos y alertas de riesgo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventTimeline bedId={bedId || ""} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 65% (increased 20% from ~55%) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Scales and Registration */}
            <Card>
              <CardHeader>
                <CardTitle>Escalas Clínicas</CardTitle>
                <CardDescription>
                  Última evaluación - {format(new Date(), "dd MMM yyyy HH:mm", { locale: es })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bedData.scales.map((scale) => (
                    <div key={scale.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{scale.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {scale.value} / {scale.maxValue} puntos
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegisterScale(scale.label)}
                        >
                          <ClipboardList className="mr-2 h-4 w-4" />
                          Registrar
                        </Button>
                      </div>
                      <Progress 
                        value={(scale.value / scale.maxValue) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Clinical Notes Section - Moved to second column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Notas Clínicas
                </CardTitle>
                <CardDescription>
                  Registro y visualización de notas del equipo de salud
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Note */}
                <div className="space-y-3">
                  <Textarea
                    placeholder="Escribir nueva nota clínica..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button 
                    onClick={handleAddNote} 
                    disabled={!newNote.trim()}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Nota
                  </Button>
                </div>

                {/* Notes History */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Historial de Notas
                  </h4>
                  <div className="space-y-3">
                    {displayedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-lg border bg-muted/30"
                      >
                        <p className="text-sm text-foreground">{note.content}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>{note.author}</span>
                          <span>
                            {format(note.date, "dd MMM yyyy HH:mm", { locale: es })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {hasMoreNotes && (
                    <Button
                      variant="outline"
                      onClick={handleLoadMoreNotes}
                      className="w-full mt-4"
                    >
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Cargar más
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Clinical Factors Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Factores Clínicos</DialogTitle>
            <DialogDescription>
              Agregar o quitar factores clínicos de la lista
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add New Factor */}
            <div className="flex gap-2">
              <Input
                placeholder="Nuevo factor clínico..."
                value={newFactorLabel}
                onChange={(e) => setNewFactorLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFactor()}
              />
              <Button onClick={handleAddFactor} disabled={!newFactorLabel.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Existing Factors List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {factorOptions.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
                >
                  <span className="text-sm font-medium">{factor.label}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveFactor(factor.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ScaleRegistrationDialog
        open={scaleDialogOpen}
        onOpenChange={setScaleDialogOpen}
        scaleName={selectedScale}
        patientName={bedData.patientName}
      />
    </div>
  );
};

export default BedDetail;
