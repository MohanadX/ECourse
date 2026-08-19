import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";

// Load Test Dataset: Parse k6-users.json into a SharedArray
// This keeps memory usage minimal across VUs
const users = new SharedArray("users", function () {
  // open() paths are relative to the script's location
  return JSON.parse(open("./k6-users.json"));
});

// Load Test Configuration Options
export const options = {
  stages: [
    { duration: "30s", target: 50 }, // Ramp-up to 50 VUs
    { duration: "1m", target: 200 }, // Hold at 200 VUs
    { duration: "30s", target: 500 }, // Ramp-up to 500 VUs
    { duration: "1m", target: 500 }, // Hold at 500 VUs
    { duration: "30s", target: 0 }, // Ramp-down to 0 VUs
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests must complete below 500ms
    http_req_failed: ["rate<0.01"], // Error rate must be less than 1%
  },
};

export default function k6Test() {
  // User Distribution & Request Logic
  // Map each VU to a unique user in the dataset safely
  const user = users[__VU % users.length];

  const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

  // Set the Clerk session cookie (__session) in the cookie jar
  const jar = http.cookieJar();
  jar.set(BASE_URL, "__session", user.token, {
    domain: "localhost",
    path: "/",
  });

  // Send Authorization Header on requests
  const params = {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  };

  // Perform action 1: Authenticated SSR route
  // (Assuming '/' belongs to the consumer route group)
  const resSsr = http.get(`${BASE_URL}/`, params);
  check(resSsr, {
    "SSR route status is 200": (r) => r.status === 200,
  });

  // Realistic delay between actions
  sleep(1);

  // Perform action 2: Authenticated API endpoint
  const resApi = http.get(`${BASE_URL}/api/coupon`, params);
  check(resApi, {
    "API endpoint status is 200": (r) => r.status === 200,
  });

  // Realistic delay before next iteration
  sleep(2);
}
