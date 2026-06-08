import { JobsSearch } from './jobs-search';

export const metadata = {
  title: 'Search jobs',
  description: 'Browse jobs by skill, location, work mode, and salary.',
};

export default function JobsPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Search jobs</h1>
      <JobsSearch />
    </main>
  );
}
