import http from "k6/http";
import { check, sleep, group } from "k6";

/**
 * K6 Load Test - StayAsBackend (Admin)
 *
 * Flujo:
 *  1) setup() — login admin, obtiene token (1 vez)
 *  2) default() — GET /api/users con token (por cada VU)
 *
 * ENV:
 *  - BASE_URL       (obligatorio en CI)
 *  - ADMIN_EMAIL    (obligatorio en CI)
 *  - ADMIN_PASSWORD (obligatorio en CI)
 */

export const options = {
  stages: [
    { duration: "10s", target: 1 },
    { duration: "20s", target: 2 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.10"],
    http_req_duration: ["p(95)<3000"],
    checks: ["rate>0.90"],
  },
};

const BASE_URL = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || "";

function jsonHeaders(token) {
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return { headers: h, timeout: "60s" };
}

// Se ejecuta 1 vez antes de iniciar los VUs
export function setup() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("FATAL: faltan ADMIN_EMAIL o ADMIN_PASSWORD en variables de entorno.");
  }

  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    jsonHeaders()
  );

  const ok = check(res, {
    "setup: login status is 200": (r) => r.status === 200,
    "setup: login returns JSON": (r) =>
      (r.headers["Content-Type"] || "").includes("application/json"),
  });

  if (!ok) {
    console.error(`Setup login failed — status: ${res.status} body: ${res.body}`);
    throw new Error("No se pudo autenticar. Abortando test.");
  }

  const body = res.json();
  const token = body.token || body.accessToken || body.jwt || null;

  if (!token) {
    console.error("Respuesta del login:", res.body);
    throw new Error("No vino token en la respuesta del login.");
  }

  return { token };
}

export default function (data) {
  const token = data?.token;

  group("01 - Admin: List users", () => {
    const res = http.get(`${BASE_URL}/api/users`, jsonHeaders(token));

    check(res, {
      "users status is 200": (r) => r.status === 200,
      "users returns JSON": (r) =>
        (r.headers["Content-Type"] || "").includes("application/json"),
      "users has body": (r) => (r.body || "").length > 0,
    });

    sleep(1);
  });
}