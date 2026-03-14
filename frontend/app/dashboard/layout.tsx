import { redirect } from 'next/navigation';
import { unstable_noStore } from 'next/cache';
import { createServerSupabaseClient, getCurrentUserRole } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  unstable_noStore();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const role = await getCurrentUserRole(supabase, user.id);
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar user={{ id: user.id, email: user.email ?? '', role }} />
      <main className="flex-1 overflow-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}
