import { useAuthV2 } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Crown, Shield, TreePine } from 'lucide-react';

const roleIcons = {
  admin: Crown,
  qtra_arborist: Shield,
  certified_arborist: TreePine,
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
  user: 'bg-gradient-to-r from-slate-500 to-gray-500',
};

export function UserProfile() {
  const { profile, signOut } = useAuthV2();

  if (!profile) return null;

  const handleSignOut = async () => {
    await signOut();
  };

  const primaryRole = profile.roles[0] || 'user';
  const RoleIcon = roleIcons[primaryRole];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || 'User'} />
            <AvatarFallback className={roleColors[primaryRole]}>
              <RoleIcon className="h-5 w-5 text-white" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">
              {profile.display_name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile.email}
            </p>
            <div className="flex flex-wrap gap-1">
              {profile.roles.map((role) => {
                const Icon = roleIcons[role];
                return (
                  <Badge key={role} variant="secondary" className="text-xs">
                    <Icon className="h-3 w-3 mr-1" />
                    {roleLabels[role]}
                  </Badge>
                );
              })}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}