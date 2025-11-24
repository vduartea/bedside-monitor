import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ClipboardList } from "lucide-react";

const scaleSchemas = {
  Glasgow: z.object({
    apertura_ocular: z.coerce.number().min(1).max(4),
    respuesta_verbal: z.coerce.number().min(1).max(5),
    respuesta_motora: z.coerce.number().min(1).max(6),
  }),
  Norton: z.object({
    estado_fisico: z.coerce.number().min(1).max(4),
    estado_mental: z.coerce.number().min(1).max(4),
    actividad: z.coerce.number().min(1).max(4),
    movilidad: z.coerce.number().min(1).max(4),
    incontinencia: z.coerce.number().min(1).max(4),
  }),
  Morse: z.object({
    historial_caidas: z.coerce.number().min(0).max(25),
    diagnostico_secundario: z.coerce.number().min(0).max(15),
    ayuda_deambulacion: z.coerce.number().min(0).max(30),
    terapia_intravenosa: z.coerce.number().min(0).max(20),
    marcha: z.coerce.number().min(0).max(20),
    estado_mental: z.coerce.number().min(0).max(15),
  }),
  Downton: z.object({
    caidas_previas: z.coerce.number().min(0).max(1),
    medicamentos: z.coerce.number().min(0).max(1),
    deficit_sensorial: z.coerce.number().min(0).max(1),
    estado_mental: z.coerce.number().min(0).max(1),
    deambulacion: z.coerce.number().min(0).max(1),
  }),
};

const scaleFields = {
  Glasgow: [
    { name: "apertura_ocular", label: "Apertura Ocular", max: 4 },
    { name: "respuesta_verbal", label: "Respuesta Verbal", max: 5 },
    { name: "respuesta_motora", label: "Respuesta Motora", max: 6 },
  ],
  Norton: [
    { name: "estado_fisico", label: "Estado Físico", max: 4 },
    { name: "estado_mental", label: "Estado Mental", max: 4 },
    { name: "actividad", label: "Actividad", max: 4 },
    { name: "movilidad", label: "Movilidad", max: 4 },
    { name: "incontinencia", label: "Incontinencia", max: 4 },
  ],
  Morse: [
    { name: "historial_caidas", label: "Historial de Caídas", max: 25 },
    { name: "diagnostico_secundario", label: "Diagnóstico Secundario", max: 15 },
    { name: "ayuda_deambulacion", label: "Ayuda para Deambulación", max: 30 },
    { name: "terapia_intravenosa", label: "Terapia Intravenosa", max: 20 },
    { name: "marcha", label: "Marcha", max: 20 },
    { name: "estado_mental", label: "Estado Mental", max: 15 },
  ],
  Downton: [
    { name: "caidas_previas", label: "Caídas Previas", max: 1 },
    { name: "medicamentos", label: "Medicamentos", max: 1 },
    { name: "deficit_sensorial", label: "Déficit Sensorial", max: 1 },
    { name: "estado_mental", label: "Estado Mental", max: 1 },
    { name: "deambulacion", label: "Deambulación", max: 1 },
  ],
};

interface ScaleRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scaleName: string;
  patientName: string;
}

export function ScaleRegistrationDialog({
  open,
  onOpenChange,
  scaleName,
  patientName,
}: ScaleRegistrationDialogProps) {
  const schema = scaleSchemas[scaleName as keyof typeof scaleSchemas];
  const fields = scaleFields[scaleName as keyof typeof scaleFields];

  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
  });

  function onSubmit(values: any) {
    const total = Object.values(values).reduce((acc: number, val) => acc + Number(val), 0);
    console.log(`${scaleName} Scale:`, values, `Total: ${total}`);
    
    toast({
      title: "Escala registrada exitosamente",
      description: `${scaleName} para ${patientName}. Puntaje total: ${total}`,
    });
    
    form.reset();
    onOpenChange(false);
  }

  if (!schema || !fields) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Registrar Escala {scaleName}
          </DialogTitle>
          <DialogDescription>
            Paciente: {patientName}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {fields.map((field) => (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={`0-${field.max}`}
                        {...formField}
                      />
                    </FormControl>
                    <FormDescription>
                      Rango válido: 0 - {field.max}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar Evaluación</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
