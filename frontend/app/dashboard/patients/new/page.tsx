import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PatientForm } from '@/components/patients/patient-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUserRole } from '@/lib/supabase/server';
import { canAddPatient } from '@/lib/utils';

export default async function NewPatientPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const role = await getCurrentUserRole(supabase, user.id);
  if (!canAddPatient(role)) redirect('/dashboard/patients');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Add patient</h1>
      <p className="text-muted-foreground">Register a new patient.</p>
      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle>Patient details</CardTitle>
          <CardDescription>Demographics and contact information.</CardDescription>
        </CardHeader>
        <CardContent>
          <PatientForm />
        </CardContent>
      </Card>
    </div>
  );
}
