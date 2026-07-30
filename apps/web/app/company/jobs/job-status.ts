// Moved to lib/ui/status.ts, which now holds every enum → label → Badge tone
// mapping in the app. Re-exported here so the two company call sites keep their
// local import path.
export { JOB_STATUS_LABEL, JOB_STATUS_TONE } from '@/lib/ui/status';
