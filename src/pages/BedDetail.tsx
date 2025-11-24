import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Activity, 
  AlertCircle, 
  TrendingUp,
  Calendar,
  ClipboardList,
  Heart,
  Thermometer,
  Droplets,
  Wind
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScaleRegistrationDialog } from "@/components/ScaleRegistrationDialog";
import { EventTimeline } from "@/components/EventTimeline";
import { VitalSignsChart } from "@/components/VitalSignsChart";
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
    vitalSigns: [
      { time: "06:00", hr: 78, bp: "120/80", temp: 36.8, spo2: 98 },
      { time: "12:00", hr: 82, bp: "125/82", temp: 37.1, spo2: 97 },
      { time: "18:00", hr: 76, bp: "118/78", temp: 36.9, spo2: 98 },
    ],
    medications: [
      { name: "Amoxicilina", dose: "500mg", frequency: "c/8h", route: "VO" },
      { name: "Paracetamol", dose: "1g", frequency: "c/6h PRN", route: "VO" },
      { name: "Omeprazol", dose: "40mg", frequency: "c/24h", route: "VO" },
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
    vitalSigns: [
      { time: "06:00", hr: 92, bp: "135/88", temp: 37.2, spo2: 95 },
      { time: "12:00", hr: 88, bp: "130/85", temp: 37.4, spo2: 96 },
      { time: "18:00", hr: 85, bp: "128/82", temp: 37.0, spo2: 97 },
    ],
    medications: [
      { name: "Atorvastatina", dose: "40mg", frequency: "c/24h", route: "VO" },
      { name: "AAS", dose: "100mg", frequency: "c/24h", route: "VO" },
      { name: "Enalapril", dose: "10mg", frequency: "c/12h", route: "VO" },
      { name: "Furosemida", dose: "40mg", frequency: "c/12h", route: "VO" },
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

  const bedData = mockBedData[bedId as keyof typeof mockBedData];

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

            {/* Vital Signs Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Signos Vitales
                </CardTitle>
                <CardDescription>Últimas 24 horas</CardDescription>
              </CardHeader>
              <CardContent>
                <VitalSignsChart data={bedData.vitalSigns} />
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

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Vital Signs */}
            <Card>
              <CardHeader>
                <CardTitle>Signos Vitales Actuales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bedData.vitalSigns[bedData.vitalSigns.length - 1] && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium">FC</span>
                      </div>
                      <span className="text-xl font-bold">
                        {bedData.vitalSigns[bedData.vitalSigns.length - 1].hr} lpm
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-medium">PA</span>
                      </div>
                      <span className="text-xl font-bold">
                        {bedData.vitalSigns[bedData.vitalSigns.length - 1].bp} mmHg
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-5 w-5 text-orange-500" />
                        <span className="text-sm font-medium">Temp</span>
                      </div>
                      <span className="text-xl font-bold">
                        {bedData.vitalSigns[bedData.vitalSigns.length - 1].temp}°C
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wind className="h-5 w-5 text-cyan-500" />
                        <span className="text-sm font-medium">SpO₂</span>
                      </div>
                      <span className="text-xl font-bold">
                        {bedData.vitalSigns[bedData.vitalSigns.length - 1].spo2}%
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Medications */}
            <Card>
              <CardHeader>
                <CardTitle>Medicación Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bedData.medications.map((med, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <p className="font-medium text-foreground">{med.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {med.dose} - {med.frequency} ({med.route})
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metrics Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas del Día</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Balance Hídrico</span>
                    <span className="text-sm font-bold">+350 ml</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Ingesta Oral</span>
                    <span className="text-sm font-bold">1200 ml</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Diuresis</span>
                    <span className="text-sm font-bold">850 ml</span>
                  </div>
                  <Progress value={65} className="h-2" />
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
