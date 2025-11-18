import BedCard from "@/components/BedCard";
import { Activity, Menu, UserPlus, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const Index = () => {
  const bedsData = [
    {
      bedName: "Cama 101",
      patientName: "María González",
      patientAge: 68,
      diagnosis: "Neumonía adquirida en la comunidad",
      scales: [
        { label: "Glasgow", value: 15 },
        { label: "Norton", value: 18 },
        { label: "Morse", value: 45 },
      ],
      risks: {
        fallRisk: "medium" as const,
        extubationRisk: "low" as const,
        pressureInjuryRisk: "medium" as const,
      },
    },
    {
      bedName: "Cama 102",
      patientName: "Juan Pérez",
      patientAge: 52,
      diagnosis: "Post-operatorio cirugía cardíaca",
      scales: [
        { label: "Glasgow", value: 14 },
        { label: "Norton", value: 16 },
        { label: "Morse", value: 65 },
      ],
      risks: {
        fallRisk: "high" as const,
        extubationRisk: "high" as const,
        pressureInjuryRisk: "low" as const,
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Monitorización de Camas
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sistema de seguimiento en tiempo real
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Ingresar Paciente
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bedsData.map((bed, index) => (
            <BedCard key={index} {...bed} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
