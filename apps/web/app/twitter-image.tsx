// Same card as the Open Graph image. `runtime` is intentionally not declared:
// Next 16.4 rejects the route-segment `runtime` option when
// `cacheComponents` is on, and the Edge runtime it selected is deprecated. The
// card uses no Node-only API, so the default (Node.js) runtime is fine.
export { default, alt, size, contentType } from './opengraph-image';
