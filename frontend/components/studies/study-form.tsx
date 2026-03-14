'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

type Patient = { id: string; first_name: string; last_name: string };

export function StudyForm({ defaultPatientId }: { defaultPatientId?: string }) {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [form, setForm] = useState({
    patient_id: defaultPatientId ?? '',
    modality: 'DX',
    body_part: '',
    description: '',
  });
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const client = createClient();
    client
      .from('patients')
      .select('id, first_name, last_name')
      .order('last_name')
      .then(({ data }) => setPatients(data ?? []));
  }, []);

  useEffect(() => {
    if (defaultPatientId) setForm((f) => ({ ...f, patient_id: defaultPatientId }));
  }, [defaultPatientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patient_id) {
      toast({ title: 'Select a patient', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Error', description: 'Not signed in', variant: 'destructive' });
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle();
    const orgId = profile?.organization_id ?? null;
    const { data: study, error } = await supabase
      .from('studies')
      .insert({
        organization_id: orgId,
        patient_id: form.patient_id,
        modality: form.modality,
        body_part: form.body_part || null,
        description: form.description || null,
        status: 'scheduled',
      })
      .select('id')
      .single();
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Study created' });
    router.push(`/dashboard/studies/${study.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="patient_id">Patient *</Label>
        <select
          id="patient_id"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.patient_id}
          onChange={(e) => setForm((f) => ({ ...f, patient_id: e.target.value }))}
        >
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.last_name}, {p.first_name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="modality">Modality</Label>
          <select
            id="modality"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.modality}
            onChange={(e) => setForm((f) => ({ ...f, modality: e.target.value }))}
          >
            <option value="DX">DX (Digital X-Ray)</option>
            <option value="CR">CR</option>
            <option value="CT">CT</option>
            <option value="MR">MR</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="body_part">Body part</Label>
          <Input
            id="body_part"
            placeholder="e.g. Chest, Knee"
            value={form.body_part}
            onChange={(e) => setForm((f) => ({ ...f, body_part: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create study'}
      </Button>
    </form>
  );
}
