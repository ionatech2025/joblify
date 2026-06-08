import path from 'node:path';

// Shared storage-state paths for the authenticated e2e flows. Kept in a plain
// (non-test) module so specs can import it without loading the setup test.
// The .auth directory is gitignored — these files hold live session tokens.
export const STORAGE = {
  jobseeker: path.join(__dirname, '.auth/jobseeker.json'),
  company: path.join(__dirname, '.auth/company.json'),
};
