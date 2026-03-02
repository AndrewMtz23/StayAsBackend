import http from "k6/http";
import { check, sleep, group } from "k6";

/**
 * K6 Load Test - StayAsBackend (GENÉRICO)
 *
 * Variables de entorno recomendadas:
 * - BASE_URL (obligatorio en CI)  Ej: https://stay-as-back.onrender.com
 * - HEALTH_PATH (opcional)        Default: /
 * - LIST_PATH (opcional)          Default: /api/properties
 * - API_TOKEN (opcional)          Si tu endpoint requiere auth (Bearer)
 *
 * Ejecutar local:
 *   k6 run -e BASE_URL="http://localhost:3000" tests/k6/loadtest.js
 *
 * Ejecutar en CI:
 *   k6 run -e BASE_URL="${BASE_URL}" tests/k6/loadtest.js
 */

export const options = {
  stages: [
    { duration: "20s", target: 5 },
    { duration: "40s", target: 10 },
    { duration: "20s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<800"],
    checks: ["rate>0.98"],
  },
};

const BASE_URL = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const HEALTH_PATH = __ENV.HEALTH_PATH || "/";
const LIST_PATH = __ENV.LIST_PATH || "/api/properties";
const API_TOKEN = __ENV.API_TOKEN || "";

function commonHeaders() {
  const h = { "Content-Type": "application/json" };
  if (API_TOKEN) h.Authorization = `Bearer ${API_TOKEN}`;
  return h;
}

function joinUrl(base, path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export default function () {
  group("01 - Root/Health", () => {
    const url = joinUrl(BASE_URL, HEALTH_PATH);
    const res = http.get(url, { headers: commonHeaders(), tags: { name: `GET ${HEALTH_PATH}` } });

    check(res, {
      "health/root status is 200": (r) => r.status === 200,
      "health/root responds fast (<800ms)": (r) => r.timings.duration < 800,
      "health/root has body": (r) => (r.body || "").length > 0,
    });

    sleep(1);
  });

  group("02 - Public list/endpoint clave", () => {
    const url = joinUrl(BASE_URL, LIST_PATH);
    const res = http.get(url, { headers: commonHeaders(), tags: { name: `GET ${LIST_PATH}` } });

    // Si tu endpoint no existe todavía, aquí verás 404. Cambia LIST_PATH por uno real.
    check(res, {
      "endpoint status is 200 (or 401 if protected)": (r) => r.status === 200 || r.status === 401,
      "response has body": (r) => (r.body || "").length > 0,
    });

    sleep(1);
  });
}