import { redirect } from 'next/navigation';
import { createServerSupabaseClient, getCurrentUserRole } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2 } from 'lucide-react';

// Always run on the server per request so role changes in DB take effect immediately
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const role = await getCurrentUserRole(supabase, user.id);
  const isAdmin = role === 'admin';

  if (!isAdmin) redirect('/dashboard');

  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  const { count: orgsCount } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="text-muted-foreground">Platform overview and settings.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{usersCount ?? 0}</p>
            <p className="text-sm text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{orgsCount ?? 0}</p>
            <p className="text-sm text-muted-foreground">Organizations</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
