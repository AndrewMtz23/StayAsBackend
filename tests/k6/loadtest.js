import http from "k6/http";
import { check, sleep, group } from "k6";

/**
 * K6 Load Test - StayAsBackend (Admin)
 * Flujo:
 * 1) Login admin (setup) -> obtiene token
 * 2) GET /api/users (requiere ADMIN/EMPLOYEE)
 *
 * Variables de entorno:
 * - BASE_URL (obligatorio en CI)
 * - ADMIN_EMAIL (obligatorio en CI)
 * - ADMIN_PASSWORD (obligatorio en CI)
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

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || "";

function jsonHeaders(token) {
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

// Se ejecuta 1 vez antes de iniciar los VUs
export function setup() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Faltan ADMIN_EMAIL o ADMIN_PASSWORD en variables de entorno.");
  }

  const payload = JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
    headers: jsonHeaders(),
    tags: { name: "POST /api/auth/login (setup)" },
    timeout: "30s",
  });

  const ok = check(res, {
    "login status is 200/201": (r) => [200, 201].includes(r.status),
    "login returns JSON": (r) =>
      (r.headers["Content-Type"] || "").includes("application/json"),
  });

  if (!ok) {
    // Esto ayuda a debuggear cuando falla en CI
    console.error("Login failed:", res.status, res.body);
    throw new Error("No se pudo autenticar para obtener token.");
  }

  const body = res.json();
  const token = body.token || body.accessToken || body.jwt || null;

  if (!token) throw new Error("No vino token en la respuesta del login.");

  return { token };
}

export default function (data) {
  const token = data?.token;

  group("01 - Admin: List users", () => {
    const res = http.get(`${BASE_URL}/api/users`, {
      headers: jsonHeaders(token),
      tags: { name: "GET /api/users" },
      timeout: "30s",
    });

    check(res, {
      "users status is 200": (r) => r.status === 200,
      "users returns JSON": (r) =>
        (r.headers["Content-Type"] || "").includes("application/json"),
      "users has body": (r) => (r.body || "").length > 0,
    });

    sleep(1);
  });
}