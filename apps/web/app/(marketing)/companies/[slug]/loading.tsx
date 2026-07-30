// Sitting above the page, this also gives the route a Suspense boundary over
// its `await params`, so the static shell (with the skeleton in the hole) can
// prerender under cacheComponents. The markup is shared with page.tsx's own
// fallback — see company-detail-skeleton.tsx.
export { CompanyDetailSkeleton as default } from './company-detail-skeleton';
