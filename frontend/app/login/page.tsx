import Link from 'next/link';
import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const hasSupabaseEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  if (!hasSupabaseEnv) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-primary">
            <Activity className="h-8 w-8" />
            <span className="font-semibold">NextGen Medical Imaging</span>
          </Link>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-amber-800">Supabase not configured</CardTitle>
              <CardDescription>
                Set these in <code className="rounded bg-amber-100 px-1 font-mono text-sm">frontend/.env.local</code> and restart the dev server:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium text-amber-900">Required variables:</p>
              <ul className="list-inside list-disc space-y-1 font-mono text-amber-900">
                <li>NEXT_PUBLIC_SUPABASE_URL</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
              <p className="text-muted-foreground">
                Copy from the project root <code className="rounded bg-muted px-1">.env.example</code> or get them from Supabase Dashboard → Project Settings → API.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-primary">
          <Activity className="h-8 w-8" />
          <span className="font-semibold">NextGen Medical Imaging</span>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your credentials to access the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            {message ? (
              <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}
            {error ? (
              <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <form action="/auth/login" method="POST" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@hospital.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
