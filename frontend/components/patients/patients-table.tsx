'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Database } from '@/types/supabase';

type Patient = Database['public']['Tables']['patients']['Row'];

export function PatientsTable({ patients }: { patients: Partial<Patient>[] }) {
  if (patients.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No patients registered yet.</p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">MRN</th>
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">DOB</th>
            <th className="px-4 py-3 text-left font-medium">Gender</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="px-4 py-3">{p.mrn ?? '—'}</td>
              <td className="px-4 py-3 font-medium">
                {p.first_name} {p.last_name}
              </td>
              <td className="px-4 py-3">
                {p.date_of_birth
                  ? new Date(p.date_of_birth).toLocaleDateString()
                  : '—'}
              </td>
              <td className="px-4 py-3">{p.gender ?? '—'}</td>
              <td className="px-4 py-3 text-right">
                <Link href={`/dashboard/patients/${p.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
