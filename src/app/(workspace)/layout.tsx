import { redirect } from 'next/navigation';
import { Providers } from '@/components/providers';
import { Shell } from '@/components/shell';
import { demoMode } from '@/lib/server/config';
import { getUser } from '@/lib/server/auth';
export const dynamic = 'force-dynamic';
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const demo = demoMode();
  const user = demo
    ? { name: 'Demo Member', email: 'demo@example.invalid', role: 'admin' as const }
    : await getUser();
  if (!user) redirect('/login');
  return (
    <Providers demo={demo} user={user}>
      <Shell>{children}</Shell>
    </Providers>
  );
}
