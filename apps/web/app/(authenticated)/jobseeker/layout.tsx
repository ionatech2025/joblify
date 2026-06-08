import Link from 'next/link';

const link: React.CSSProperties = { color: '#111', textDecoration: 'none' };

// Jobseeker sub-nav. Auth is already enforced by the (authenticated) layout.
export default function JobseekerLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <nav
        style={{
          display: 'flex',
          gap: '1.25rem',
          padding: '0.75rem 2rem',
          borderBottom: '1px solid #eee',
          fontSize: '0.95rem',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/jobseeker/applications" style={link}>
          Applications
        </Link>
        <Link href="/jobseeker/saved" style={link}>
          Saved
        </Link>
        <Link href="/jobseeker/resumes" style={link}>
          Resumes
        </Link>
        <Link href="/jobseeker/profile" style={link}>
          Profile
        </Link>
        <Link href="/jobseeker/notifications" style={link}>
          Notifications
        </Link>
      </nav>
      {children}
    </section>
  );
}
