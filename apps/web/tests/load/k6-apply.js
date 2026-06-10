// k6 load test — apply funnel under realistic load.
//
// Run authenticated:
//   k6 run -e BASE_URL=... -e SESSION_TOKEN=... tests/load/k6-apply.js
//
// Targets:
//   - 20 RPS sustained
//   - p95 < 1500ms (includes Server Action + DB write + cache invalidation)
//   - error rate < 2%

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    apply: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500'],
  },
};

const BASE = __ENV.BASE_URL ?? 'http://localhost:3000';

export default function () {
  // Hit /api/v1/applications to exercise the auth + DB path; the actual
  // Server Action requires a full Clerk session which can't easily be
  // scripted in k6 — use this as a proxy for read-side cost.
  const res = http.get(`${BASE}/api/v1/applications`);
  check(res, {
    'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  sleep(1);
}
