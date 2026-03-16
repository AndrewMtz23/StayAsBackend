import http from "k6/http";
import { check, group, sleep } from "k6";

/**
 * StayAsBackend - k6 Auth Test (CI-friendly)
 *
 * Flujo:
 *  1) POST /api/auth/login
 *  2) GET  /api/auth/me (con token)
 *
 * ENV:
 *  - BASE_URL      (obligatorio en CI)
 *  - TEST_EMAIL    (mapeado desde ADMIN_EMAIL en el workflow)
 *  - TEST_PASSWORD (mapeado desde ADMIN_PASSWORD en el workflow)
 */

export const options = {
  stages: [
    { duration: "10s", target: 1 },
    { duration: "20s", target: 2 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<1"],
    http_req_duration: ["p(95)<60000"],
    checks: ["rate>0"],
  },
};

const BASE_URL = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const EMAIL = __ENV.TEST_EMAIL || __ENV.ADMIN_EMAIL || "";
const PASSWORD = __ENV.TEST_PASSWORD || __ENV.ADMIN_PASSWORD || "";

const REQUEST_PARAMS = {
  timeout: "60s",
  headers: { "Content-Type": "application/json" },
};

function authHeaders(token) {
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return { headers: h, timeout: "60s" };
}

export default function () {
  if (!EMAIL || !PASSWORD) {
    check(null, { "FATAL: faltan TEST_EMAIL/TEST_PASSWORD en secrets": () => false });
    return;
  }

  let token = "";

  group("01 - Login", () => {
    const payload = JSON.stringify({ email: EMAIL, password: PASSWORD });
    const res = http.post(`${BASE_URL}/api/auth/login`, payload, REQUEST_PARAMS);

    const ok = check(res, {
      "login status is 200": (r) => r.status === 200,
      "login returns JSON": (r) =>
        (r.headers["Content-Type"] || "").includes("application/json"),
      "login returns token": (r) => {
        try {
          const b = r.json();
          return !!(b.token || b.accessToken || b.jwt);
        } catch {
          return false;
        }
      },
    });

    if (ok) {
      const body = res.json();
      token = body.token || body.accessToken || body.jwt || "";
    } else {
      console.error(`Login failed — status: ${res.status} body: ${res.body}`);
    }
  });

  group("02 - Me (auth)", () => {
    const res = http.get(`${BASE_URL}/api/auth/me`, authHeaders(token));

    check(res, {
      "me is 200": (r) => r.status === 200,
      "me returns JSON": (r) =>
        (r.headers["Content-Type"] || "").includes("application/json"),
    });
  });

  sleep(1);
}