Create a k6 load testing script in `scripts/k6-test.js` to test a Next.js application using local Clerk authentication and a local PostgreSQL database.

### Core Requirements:

1. **Load Test Dataset:**
   - Import `SharedArray` from `k6/data`.
   - Read and parse `scripts/k6-users.json` using `SharedArray` to keep memory usage minimal across Virtual Users (VUs).

2. **Load Test Configuration Options (`export const options`):**
   - **Stages:**
     - 30s ramp-up to 50 VUs
     - 1m hold at 200 VUs
     - 30s ramp-up to 500 VUs
     - 1m hold at 500 VUs
     - 30s ramp-down to 0 VUs
   - **Thresholds:**
     - `http_req_duration`: p(95) < 500ms
     - `http_req_failed`: rate < 0.01 (less than 1% failure)

3. **User Distribution & Request Logic:**
   - Map each VU to a unique user in the dataset: `const user = users[__VU % users.length];`
   - Target Base URL: `__ENV.BASE_URL || 'http://localhost:3000'`
   - Set the Clerk session cookie (`__session`) in `http.cookieJar()` using `user.token`.
   - Send `Authorization: Bearer <user.token>` header on requests.
   - Perform two GET requests per iteration with checks:
     1. An authenticated SSR route (e.g., `/(consumer)`) -> Expect status `200`.
     2. An authenticated API endpoint (e.g., `/api/coupon`) -> Expect status `200`.
   - Include realistic delays between actions using `sleep(1)` or `sleep(2)`.

Keep the code concise, well-commented, and production-ready for k6 execution.
these 2 tests are minimal and experimental next we will discuss every high traffic route to tests and see all routes performance analytics
