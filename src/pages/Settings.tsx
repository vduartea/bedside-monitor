import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import UserForm from "@/components/UserForm";
import UsersTable from "@/components/UsersTable";

const Settings = () => {
  const navigate = useNavigate();
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [refreshUsers, setRefreshUsers] = useState(0);

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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Gestión de Usuarios</h2>
                <Button onClick={() => setUserFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Usuario
                </Button>
              </div>
              <UsersTable refresh={refreshUsers} />
            </div>
          </TabsContent>

          <UserForm
            open={userFormOpen}
            onOpenChange={setUserFormOpen}
            onUserAdded={() => setRefreshUsers((prev) => prev + 1)}
          />

          <TabsContent value="camas" className="mt-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Gestión de Camas</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Cama
                </Button>
              </div>
              <p className="text-muted-foreground">Aquí se gestionarán las camas del hospital.</p>
            </div>
          </TabsContent>

          <TabsContent value="escalas" className="mt-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Gestión de Escalas</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Escala
                </Button>
              </div>
              <p className="text-muted-foreground">Aquí se gestionarán las escalas clínicas.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
