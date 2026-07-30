// `runtime` can't be re-exported — Next's route-segment-config parser needs
// it declared literally in this file, so it's duplicated from
// opengraph-image.tsx rather than included in the re-export below.
export const runtime = 'edge';
export { default, alt, size, contentType } from './opengraph-image';
