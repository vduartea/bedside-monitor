import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, User, Activity } from "lucide-react";

interface BedCardProps {
  bedName: string;
  patientName: string;
  patientAge: number;
  diagnosis: string;
  scales: {
    label: string;
    value: number;
  }[];
  risks: {
    fallRisk: "low" | "medium" | "high";
    extubationRisk: "low" | "medium" | "high";
    pressureInjuryRisk: "low" | "medium" | "high";
  };
}

const getRiskColor = (risk: "low" | "medium" | "high") => {
  switch (risk) {
    case "low":
      return "bg-success text-success-foreground";
    case "medium":
      return "bg-warning text-warning-foreground";
    case "high":
      return "bg-danger text-danger-foreground";
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

const BedCard = ({
  bedName,
  patientName,
  patientAge,
  diagnosis,
  scales,
  risks,
}: BedCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    const bedId = bedName.toLowerCase().replace(" ", "-");
    navigate(`/bed/${bedId}`);
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-primary">{bedName}</span>
          <Badge variant="outline" className="bg-primary/10">
            Ocupada
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Patient Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{patientName}</span>
            <span className="text-sm text-muted-foreground">({patientAge} años)</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Diagnóstico:</span> {diagnosis}
          </div>
        </div>

        {/* Scales */}
        <div className="flex gap-2 flex-wrap">
          {scales.map((scale, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-base font-mono px-3 py-1"
            >
              {scale.label}: {scale.value.toString().padStart(2, "0")}
            </Badge>
          ))}
        </div>

        {/* Risk Alerts */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Activity className="h-4 w-4" />
            <span>Alertas de Riesgo</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Caídas</span>
              </div>
              <Badge className={getRiskColor(risks.fallRisk)}>
                {getRiskLabel(risks.fallRisk)}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Autoextubación</span>
              </div>
              <Badge className={getRiskColor(risks.extubationRisk)}>
                {getRiskLabel(risks.extubationRisk)}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Lesión por Presión</span>
              </div>
              <Badge className={getRiskColor(risks.pressureInjuryRisk)}>
                {getRiskLabel(risks.pressureInjuryRisk)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BedCard;
