import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

const UserForm = ({ open, onOpenChange, onUserAdded }: UserFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombres: "",
    apellido1: "",
    apellido2: "",
    email: "",
    password: "",
    role: "usuario" as "admin" | "doctor" | "enfermero" | "usuario",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nombres: formData.nombres,
            apellido1: formData.apellido1,
            apellido2: formData.apellido2,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        nombres: formData.nombres,
        apellido1: formData.apellido1,
        apellido2: formData.apellido2,
        email: formData.email,
      });

      if (profileError) throw profileError;

      // Assign role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: formData.role,
      });

      if (roleError) throw roleError;

      toast.success("Usuario agregado exitosamente");
      setFormData({
        nombres: "",
        apellido1: "",
        apellido2: "",
        email: "",
        password: "",
        role: "usuario",
      });
      onUserAdded();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al agregar usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombres">Nombres *</Label>
            <Input
              id="nombres"
              value={formData.nombres}
              onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apellido1">Apellido 1 *</Label>
            <Input
              id="apellido1"
              value={formData.apellido1}
              onChange={(e) => setFormData({ ...formData, apellido1: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apellido2">Apellido 2</Label>
            <Input
              id="apellido2"
              value={formData.apellido2}
              onChange={(e) => setFormData({ ...formData, apellido2: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: any) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="enfermero">Enfermero</SelectItem>
                <SelectItem value="usuario">Usuario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;
