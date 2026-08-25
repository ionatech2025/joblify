import { JobseekerConsoleNav } from './jobseeker-console-nav';

// Jobseeker workspace module menu. Auth is already enforced by the
// (authenticated) layout, which also establishes the console token register.
export default function JobseekerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JobseekerConsoleNav />
      {children}
    </>
  );
}
