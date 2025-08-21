import { useState, useEffect } from 'react';
import { useAuthV2 } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Crown, Shield, User, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UserWithProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  roles: string[];
}

const roleIcons = {
  admin: Crown,
  qtra_arborist: Shield,
  certified_arborist: CheckCircle,
  user: User,
};

const roleLabels = {
  admin: 'Admin',
  qtra_arborist: 'QTRA Arborist',
  certified_arborist: 'Certified Arborist',
  user: 'User',
};

const roleColors = {
  admin: 'bg-gradient-to-r from-amber-500 to-orange-500',
  qtra_arborist: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  certified_arborist: 'bg-gradient-to-r from-blue-500 to-indigo-500',
  user: 'bg-gradient-to-r from-gray-500 to-slate-500',
};

export function UserManagement() {
  const { hasRole } = useAuthV2();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Only admins can access this component
  if (!hasRole('admin')) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Alert>
            <AlertDescription>
              You don't have permission to manage users. Admin access required.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: rolesData } = await supabase
            .rpc('get_user_roles', { _user_id: profile.id });
          
          return {
            ...profile,
            roles: rolesData?.map((r: any) => r.role) || ['user']
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdating(userId);

      // Enhanced security: Prevent role escalation with better error handling
      const { error: insertError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: newRole as 'admin' | 'qtra_arborist' | 'certified_arborist' | 'user' 
        }, {
          onConflict: 'user_id'
        });

      if (insertError) {
        if (insertError.message.includes('cannot assign admin role')) {
          toast.error('Cannot assign admin role to self');
        } else if (insertError.message.includes('requires admin approval')) {
          toast.error('QTRA arborist role requires admin approval');
        } else if (insertError.message.includes('Only admins can change')) {
          toast.error('Only admins can change other users\' roles');
        } else {
          toast.error(`Failed to update role: ${insertError.message}`);
        }
        return;
      }

      // Refresh the users list
      await fetchUsers();
      
      toast.success(`User role updated to ${roleLabels[newRole as keyof typeof roleLabels]}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => {
            const primaryRole = user.roles[0] || 'user';
            const RoleIcon = roleIcons[primaryRole as keyof typeof roleIcons];
            
            return (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${roleColors[primaryRole as keyof typeof roleColors]}`}>
                    <RoleIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{user.display_name || 'Unnamed User'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => {
                      const Icon = roleIcons[role as keyof typeof roleIcons];
                      return (
                        <Badge key={role} variant="secondary" className="text-xs">
                          <Icon className="h-3 w-3 mr-1" />
                          {roleLabels[role as keyof typeof roleLabels]}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Select
                    value={primaryRole}
                    onValueChange={(value) => updateUserRole(user.id, value)}
                    disabled={updating === user.id}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="certified_arborist">Certified Arborist</SelectItem>
                      <SelectItem value="qtra_arborist">QTRA Arborist</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {updating === user.id && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                </div>
              </div>
            );
          })}
          
          {users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}