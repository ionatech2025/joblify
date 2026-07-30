// Sitting above the page, this also gives the route a Suspense boundary over
// its `await params`, so the static JD shell (with the skeleton in the hole) can
// prerender under cacheComponents. The markup is shared with page.tsx's own
// fallback — see job-detail-skeleton.tsx.
export { JobDetailSkeleton as default } from './job-detail-skeleton';
