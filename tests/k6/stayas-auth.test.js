import http from "k6/http";
import { check, group, sleep } from "k6";

/**
 * StayAsBackend - k6 Load Test
 * Endpoints usados (mínimo 2):
 * 1) POST /api/auth/register
 * 2) POST /api/auth/login
 * 3) GET  /api/auth/me (con token)
 *
 * Variables de entorno:
 * - BASE_URL (obligatorio en CI)
 * - TEST_PASSWORD (opcional)
 */

export const options = {
  stages: [
    { duration: "15s", target: 5 },
    { duration: "30s", target: 5 },
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],     // <2% errores
    http_req_duration: ["p(95)<1200"],  // p95 < 1.2s
    checks: ["rate>0.98"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const PASSWORD = __ENV.TEST_PASSWORD || "Pass123!";

function jsonHeaders(token) {
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export default function () {
  // Email único por VU + iteración para evitar duplicados en register
  const unique = `${__VU}-${__ITER}-${Date.now()}`;
  const email = `k6_user_${unique}@example.com`;

  group("01 - Register (public)", () => {
    const payload = JSON.stringify({
      firstName: "Juanito",
      lastName: "Perez",
      email,
      password: PASSWORD,
      phone: "5551234567",
      role: "CLIENT",
    });

    const res = http.post(`${BASE_URL}/api/auth/register`, payload, {
      headers: jsonHeaders(),
      tags: { name: "POST /api/auth/register" },
    });

    // Puede ser 201/200, o 409 si ya existe (depende tu API)
    check(res, {
      "register status is 200/201/409": (r) =>
        [200, 201, 409].includes(r.status),
    });
  });

  let token = null;

  group("02 - Login (public)", () => {
    const payload = JSON.stringify({ email, password: PASSWORD });

    const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
      headers: jsonHeaders(),
      tags: { name: "POST /api/auth/login" },
    });

    const ok = check(res, {
      "login status is 200/201": (r) => [200, 201].includes(r.status),
      "login returns JSON": (r) =>
        (r.headers["Content-Type"] || "").includes("application/json"),
    });

    if (ok) {
      const body = res.json();
      token = body.token || body.accessToken || body.jwt || null;
    }
  });

  group("03 - Me (auth)", () => {
    const res = http.get(`${BASE_URL}/api/auth/me`, {
      headers: jsonHeaders(token),
      tags: { name: "GET /api/auth/me" },
    });

    check(res, {
      "me status is 200 (or 401 if token missing)": (r) =>
        r.status === 200 || r.status === 401,
    });
  });

  sleep(1);
}