'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  FileText,
  LogOut,
  Activity,
  Shield,
} from 'lucide-react';
import { cn, getRoleLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'radiologist', 'technician', 'doctor', 'patient'] },
  { href: '/dashboard/patients', label: 'Patients', icon: Users, roles: ['admin', 'radiologist', 'technician', 'doctor', 'patient'] },
  { href: '/dashboard/studies', label: 'Studies', icon: FolderOpen, roles: ['admin', 'radiologist', 'technician', 'doctor', 'patient'] },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText, roles: ['admin', 'radiologist', 'technician', 'doctor', 'patient'] },
  { href: '/dashboard/admin', label: 'Admin', icon: Shield, roles: ['admin'] },
];

export function DashboardSidebar({ user }: { user: { id: string; email: string; role?: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const initials = user.email.slice(0, 2).toUpperCase() || 'U';
  const role = user.role ?? 'patient';
  const nav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="flex w-56 flex-col border-r bg-white">
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <Activity className="h-6 w-6 text-primary" />
        <span className="font-semibold text-foreground">NextGen</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
      <Separator />
      <div className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col items-start text-left">
                <span className="truncate text-sm">{user.email || 'User'}</span>
                <span className="text-xs text-muted-foreground">{getRoleLabel(role)}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
