import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Activity, 
  AlertCircle, 
  Calendar,
  ClipboardList,
  Plus,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [clinicalFactors, setClinicalFactors] = useState({
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

  const handleFactorChange = (factor: keyof typeof clinicalFactors) => {
    setClinicalFactors(prev => ({
      ...prev,
      [factor]: !prev[factor]
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

  const displayedNotes = bedData.clinicalNotes.slice(0, visibleNotes);
  const hasMoreNotes = bedData.clinicalNotes.length > visibleNotes;

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
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

            {/* Clinical Notes Section */}
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

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Clinical Factors */}
            <Card>
              <CardHeader>
                <CardTitle>Factores Clínicos Relevantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="intubated"
                    checked={clinicalFactors.intubated}
                    onCheckedChange={() => handleFactorChange("intubated")}
                  />
                  <Label htmlFor="intubated" className="text-sm font-medium cursor-pointer">
                    Entubado
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="sedated"
                    checked={clinicalFactors.sedated}
                    onCheckedChange={() => handleFactorChange("sedated")}
                  />
                  <Label htmlFor="sedated" className="text-sm font-medium cursor-pointer">
                    Sedado
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="agitated"
                    checked={clinicalFactors.agitated}
                    onCheckedChange={() => handleFactorChange("agitated")}
                  />
                  <Label htmlFor="agitated" className="text-sm font-medium cursor-pointer">
                    Agitado
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="limitedMobility"
                    checked={clinicalFactors.limitedMobility}
                    onCheckedChange={() => handleFactorChange("limitedMobility")}
                  />
                  <Label htmlFor="limitedMobility" className="text-sm font-medium cursor-pointer">
                    Movilidad Limitada
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Scales and Registration */}
            <Card>
              <CardHeader>
                <CardTitle>Escalas Clínicas</CardTitle>
                <CardDescription>
                  Última evaluación - {format(new Date(), "dd MMM yyyy HH:mm", { locale: es })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
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
          </div>
        </div>
      </main>

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
