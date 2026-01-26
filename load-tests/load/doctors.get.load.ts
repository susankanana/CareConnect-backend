// import http from 'k6/http';
// import { check, sleep } from 'k6';

// const BASE_URL = 'https://careconnect-backend-c2he.onrender.com';

// export const options = {
//     stages: [
//         { duration: '30s', target: 40 }, // ramp-up to 40 users over 30 seconds
//         { duration: '40s', target: 50 }, // stay at 50 users for 40 seconds
//         { duration: '10s', target: 0 },  // ramp-down to 0 users
//     ],
//     ext: {
//         loadimpact: {
//             name: 'Doctors GET Load Test',
//         },
//     },
// };

// export default function () {

//     const res = http.get(`${BASE_URL}/doctors`, {
//         headers: {
//             'Content-Type': 'application/json',
//              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjI0MiwidXNlcl9pZCI6MjQyLCJmaXJzdF9uYW1lIjoiU3VzYW4iLCJsYXN0X25hbWUiOiJLYW5hbmEiLCJyb2xlIjoiYWRtaW4iLCJpc1ZlcmlmaWVkIjpmYWxzZSwiZXhwIjoxNzUyODMxNjMxLCJpYXQiOjE3NTI1NzI0MzF9.enXQshsHcn0-x0vgSF42o5AhK8oAKMqgCJjXw4FsWSs`
//         },
//     });

//     check(res, {
//         'status is 200': (r) => r.status === 200,
//         'has data array': (r) => {
//             try {
//                 const body = JSON.parse(r.body as string);
//                 return Array.isArray(body.data);
//             } catch {
//                 return false;
//             }
//         },
//     });

//     sleep(1);
// }

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { Options } from 'k6/options';

// -----------------------------
// Environment Variables
// -----------------------------
// These allow flexibility when running tests across environments
// Example: BASE_URL, TOKEN, or VU counts can be set via CLI
// e.g. k6 run --env BASE_URL=https://api.test.com --env TOKEN=your_token script.ts

const BASE_URL = __ENV.BASE_URL || 'https://careconnect-backend-c2he.onrender.com';
const TOKEN = __ENV.TOKEN || ''; // You can dynamically inject a fresh token here

// -----------------------------
// Custom Metrics
// -----------------------------
const errorCount = new Counter('errors');
const requestDuration = new Trend('request_duration');

// -----------------------------
// Options Configuration
// -----------------------------
export const options: Options = {
  stages: [
    { duration: '30s', target: 40 }, // ramp up to 40 VUs
    { duration: '40s', target: 50 }, // stay at 50 VUs
    { duration: '10s', target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'], // less than 2% requests should fail
    http_req_duration: ['p(95)<800'], // 95% of requests should complete < 800ms
    errors: ['count<10'], // no more than 10 total custom errors
  },
  tags: {
    environment: 'staging',
    test_type: 'load',
    endpoint: 'GET /doctors',
  },
  ext: {
    loadimpact: {
      name: 'Doctors Endpoint Load Test - CareConnect',
    },
  },
};

// -----------------------------
// Token Handling (Dynamic Parameter Example)
// -----------------------------
// If tokens expire, you can refresh dynamically before use:
// This can be done via a setup() function that returns a valid token

export function setup() {
  // Example token generation — replace with your real login request if needed
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: 'suzzannekans@gmail.com.com',
      password: 'pass123',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const token = loginRes.json('token');
  return { token };
}

// -----------------------------
// Test Execution Function
// -----------------------------
export default function (data: { token: string }) {
  const authToken = TOKEN || data.token; // fallback to dynamic or env token

  const res = http.get(`${BASE_URL}/doctors`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    tags: { endpoint: '/doctors' }, // useful for filtering in reports
  });

  // -----------------------------
  // Validation & Custom Metrics
  // -----------------------------
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data array': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });

  if (!success) errorCount.add(1);

  // Track response time
  requestDuration.add(res.timings.duration);

  // Simulate user think time
  sleep(1);
}
