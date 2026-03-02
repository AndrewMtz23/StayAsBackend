import http from "k6/http";
import { check, group, sleep } from "k6";

/**
 * StayAsBackend - k6 Auth Test (CI-friendly)
 *
 * No hace REGISTER (porque en Render puede timeoutear bajo carga).
 * Flujo:
 *  1) POST /api/auth/login (con usuario real desde secrets)
 *  2) GET  /api/auth/me (con token)
 *
 * ENV:
 *  - BASE_URL (obligatorio en CI)
 *  - TEST_EMAIL (obligatorio en CI)
 *  - TEST_PASSWORD (obligatorio en CI)
 */

export const options = {
  stages: [
    { duration: "10s", target: 2 },
    { duration: "20s", target: 2 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.10"],      // tolerante para Render/free tier
    http_req_duration: ["p(95)<3000"],   // 95% debajo de 3s
    checks: ["rate>0.90"],               // 90% checks ok
  },
};

const BASE_URL = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const EMAIL = __ENV.TEST_EMAIL || "";
const PASSWORD = __ENV.TEST_PASSWORD || "";

// Timeout por request (Render puede ser lento)
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
    // Si no pusiste secrets en CI, esto te evita “falsos” errores raros
    check(null, { "Missing TEST_EMAIL/TEST_PASSWORD env vars": () => false });
    return;
  }

  let token = "";

  group("01 - Login", () => {
    const payload = JSON.stringify({ email: EMAIL, password: PASSWORD });

    const res = http.post(`${BASE_URL}/api/auth/login`, payload, REQUEST_PARAMS);

    const ok = check(res, {
      "login status is 200/201": (r) => [200, 201].includes(r.status),
      "login returns JSON": (r) =>
        (r.headers["Content-Type"] || "").includes("application/json"),
    });

    if (ok) {
      const body = res.json();
      token = body.token || body.accessToken || body.jwt || "";
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