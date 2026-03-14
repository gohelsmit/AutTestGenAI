'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export function PatientForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    mrn: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
  });
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    const { error } = await supabase.from('patients').insert({
      organization_id: orgId,
      mrn: form.mrn || null,
      first_name: form.first_name,
      last_name: form.last_name,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Patient added' });
    router.push('/dashboard/patients');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mrn">MRN</Label>
          <Input
            id="mrn"
            value={form.mrn}
            onChange={(e) => setForm((f) => ({ ...f, mrn: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Input
            id="gender"
            placeholder="M / F / Other"
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">First name *</Label>
          <Input
            id="first_name"
            required
            value={form.first_name}
            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last name *</Label>
          <Input
            id="last_name"
            required
            value={form.last_name}
            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="date_of_birth">Date of birth</Label>
        <Input
          id="date_of_birth"
          type="date"
          value={form.date_of_birth}
          onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Add patient'}
      </Button>
    </form>
  );
}
