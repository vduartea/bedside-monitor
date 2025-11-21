import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="usuarios" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="camas">Camas</TabsTrigger>
            <TabsTrigger value="escalas">Escalas</TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="mt-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Gestión de Usuarios</h2>
              <p className="text-muted-foreground">Aquí se gestionarán los usuarios del sistema.</p>
            </div>
          </TabsContent>

          <TabsContent value="camas" className="mt-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Gestión de Camas</h2>
              <p className="text-muted-foreground">Aquí se gestionarán las camas del hospital.</p>
            </div>
          </TabsContent>

          <TabsContent value="escalas" className="mt-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Gestión de Escalas</h2>
              <p className="text-muted-foreground">Aquí se gestionarán las escalas clínicas.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
