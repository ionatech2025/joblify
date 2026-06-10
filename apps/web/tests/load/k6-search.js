// k6 load test — search endpoint.
//
// Run:
//   k6 run -e BASE_URL=https://joblify-web-...vercel.app tests/load/k6-search.js
//
// Targets (production gate, Week 11):
//   - 200 RPS sustained for 5min on /api/v1/jobs/search
//   - p95 < 500ms
//   - error rate < 1%

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    search: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 400,
      stages: [
        { target: 200, duration: '2m' },
        { target: 200, duration: '5m' },
        { target: 0, duration: '1m' },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const QUERIES = [
  'engineer',
  'product manager',
  'designer',
  'sales',
  'react',
  'python',
  'remote',
  'senior',
  '',
];

const BASE = __ENV.BASE_URL ?? 'http://localhost:3000';

export default function () {
  const q = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const res = http.get(`${BASE}/api/v1/jobs/search?q=${encodeURIComponent(q)}`);
  check(res, {
    'status 200': (r) => r.status === 200,
    'has hits field': (r) => {
      try {
        const body = r.json();
        return body && typeof body === 'object' && 'hits' in body;
      } catch {
        return false;
      }
    },
  });
  sleep(0.5);
}
