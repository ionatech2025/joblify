import { ConsoleShell } from '@/app/components/console/shell';
import { ConsoleNav } from '@/app/components/console/nav';

// /admin sits outside the (authenticated) group, so it establishes the console
// register itself. The role gate stays on the page (requireRole('ADMIN')) —
// putting it here would need a Suspense boundary of its own for no gain, since
// there is exactly one route in this module.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleShell>
      <ConsoleNav
        module="Administration"
        moduleHref="/admin"
        links={[{ href: '/admin', label: 'Trust & safety', icon: 'ShieldCheck' }]}
      />
      {children}
    </ConsoleShell>
  );
}
