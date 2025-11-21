import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  nombres: string;
  apellido1: string;
  apellido2: string | null;
  email: string;
  roles: string[];
}

interface UsersTableProps {
  refresh: number;
}

const UsersTable = ({ refresh }: UsersTableProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [refresh]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = profiles?.map((profile) => ({
        id: profile.id,
        nombres: profile.nombres,
        apellido1: profile.apellido1,
        apellido2: profile.apellido2,
        email: profile.email,
        roles: roles?.filter((r) => r.user_id === profile.id).map((r) => r.role) || [],
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay usuarios configurados. Agrega el primer usuario usando el botón "Agregar Usuario".
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombres</TableHead>
            <TableHead>Apellidos</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.nombres}</TableCell>
              <TableCell>
                {user.apellido1} {user.apellido2 || ""}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell className="capitalize">
                {user.roles.join(", ") || "Sin rol"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersTable;
