import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Activity, Shield, Cloud, Stethoscope } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <Activity className="h-6 w-6" />
            NextGen Medical Imaging
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button>Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-24">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Cloud-native PACS for modern healthcare
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Capture, store, and interpret X-ray images with AI-assisted diagnostics.
            Built for scalability and secure collaboration.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start free trial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
        </section>

        <section className="mt-32 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Stethoscope,
              title: 'Patient & study management',
              desc: 'Register patients, schedule studies, and track imaging history in one place.',
            },
            {
              icon: Cloud,
              title: 'DICOM in the cloud',
              desc: 'Upload and store DICOM files securely with Supabase Storage.',
            },
            {
              icon: Activity,
              title: 'AI diagnostics',
              desc: 'Detect fractures, lung opacity, and more with AI-assisted analysis.',
            },
            {
              icon: Shield,
              title: 'HIPAA-ready security',
              desc: 'Audit logs, encryption, and role-based access control.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border bg-card p-6 shadow-sm"
            >
              <item.icon className="h-10 w-10 text-primary" />
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          NextGen Medical Imaging Platform · Healthcare use only
        </div>
      </footer>
    </div>
  );
}
