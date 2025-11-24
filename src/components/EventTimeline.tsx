import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, AlertCircle, Shield, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EventType = "fall" | "extubation" | "pressure" | "scale" | "vital";

interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: Date;
  severity: "low" | "medium" | "high";
}

// Mock data - En producción vendría de la base de datos
const mockEvents: TimelineEvent[] = [
  {
    id: "1",
    type: "fall",
    title: "Alerta de Riesgo de Caída",
    description: "Escala Morse registró 65 puntos (Riesgo Alto)",
    timestamp: new Date("2024-11-24T14:30:00"),
    severity: "high",
  },
  {
    id: "2",
    type: "scale",
    title: "Evaluación Glasgow",
    description: "Puntaje: 15/15 - Estado neurológico estable",
    timestamp: new Date("2024-11-24T12:00:00"),
    severity: "low",
  },
  {
    id: "3",
    type: "pressure",
    title: "Cambio de Posición",
    description: "Rotación preventiva realizada según protocolo Norton",
    timestamp: new Date("2024-11-24T10:00:00"),
    severity: "medium",
  },
  {
    id: "4",
    type: "vital",
    title: "Signos Vitales Normales",
    description: "FC: 78 lpm, PA: 120/80 mmHg, Temp: 36.8°C, SpO₂: 98%",
    timestamp: new Date("2024-11-24T08:00:00"),
    severity: "low",
  },
  {
    id: "5",
    type: "extubation",
    title: "Evaluación de Sedación",
    description: "RASS -2, sin signos de agitación",
    timestamp: new Date("2024-11-24T06:00:00"),
    severity: "low",
  },
  {
    id: "6",
    type: "fall",
    title: "Intervención Preventiva",
    description: "Barandas elevadas, timbre al alcance, iluminación adecuada",
    timestamp: new Date("2024-11-23T20:00:00"),
    severity: "medium",
  },
];

const eventTypeConfig = {
  fall: {
    icon: AlertTriangle,
    label: "Caída",
    color: "text-orange-500",
  },
  extubation: {
    icon: AlertCircle,
    label: "Autoextubación",
    color: "text-red-500",
  },
  pressure: {
    icon: Shield,
    label: "Lesión por Presión",
    color: "text-blue-500",
  },
  scale: {
    icon: AlertCircle,
    label: "Escala",
    color: "text-purple-500",
  },
  vital: {
    icon: AlertCircle,
    label: "Signos Vitales",
    color: "text-green-500",
  },
};

const getSeverityColor = (severity: "low" | "medium" | "high") => {
  switch (severity) {
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  }
};

const getSeverityLabel = (severity: "low" | "medium" | "high") => {
  switch (severity) {
    case "low":
      return "Bajo";
    case "medium":
      return "Medio";
    case "high":
      return "Alto";
  }
};

interface EventTimelineProps {
  bedId: string;
}

export function EventTimeline({ bedId }: EventTimelineProps) {
  const [filters, setFilters] = useState<Set<EventType>>(new Set());

  const filteredEvents = filters.size === 0
    ? mockEvents
    : mockEvents.filter(event => filters.has(event.type));

  const toggleFilter = (type: EventType) => {
    const newFilters = new Set(filters);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    setFilters(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredEvents.length} evento{filteredEvents.length !== 1 ? "s" : ""}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
              {filters.size > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.size}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Tipo de Evento</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(eventTypeConfig).map(([type, config]) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={filters.has(type as EventType)}
                onCheckedChange={() => toggleFilter(type as EventType)}
              >
                <config.icon className={`mr-2 h-4 w-4 ${config.color}`} />
                {config.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative space-y-4">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        {filteredEvents.map((event) => {
          const EventIcon = eventTypeConfig[event.type].icon;
          const iconColor = eventTypeConfig[event.type].color;

          return (
            <div key={event.id} className="relative pl-10">
              {/* Icon */}
              <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-card">
                <EventIcon className={`h-4 w-4 ${iconColor}`} />
              </div>

              {/* Content */}
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-foreground">{event.title}</h4>
                  <Badge className={getSeverityColor(event.severity)}>
                    {getSeverityLabel(event.severity)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {event.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(event.timestamp, "dd MMM yyyy - HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
