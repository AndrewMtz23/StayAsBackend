import http from "k6/http";
import { check, sleep, group } from "k6";

/**
 * K6 Load Test - StayAsBackend
 * ENV:
 *  - BASE_URL
 *  - API_TOKEN (opcional si quieres pegar endpoints protegidos)
 */

export const options = {
  stages: [
    { duration: "15s", target: 3 },
    { duration: "30s", target: 3 },
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.10"],
    http_req_duration: ["p(95)<3000"],
    checks: ["rate>0.90"],
  },
};

const BASE_URL = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const API_TOKEN = __ENV.API_TOKEN || "";

function commonHeaders() {
  const h = { "Content-Type": "application/json" };
  if (API_TOKEN) h.Authorization = `Bearer ${API_TOKEN}`;
  return { headers: h, timeout: "60s" };
}

export default function () {
  group("01 - Ping (/)", () => {
    const res = http.get(`${BASE_URL}/`, commonHeaders());

    check(res, {
      "ping status is 200": (r) => r.status === 200,
    });

    sleep(1);
  });

  group("02 - Public endpoint example", () => {
    // Ajusta este endpoint a uno que de verdad exista y sea PUBLICO
    // Si /api/properties requiere auth, te va a fallar.
    const res = http.get(`${BASE_URL}/api/properties`, commonHeaders());

    check(res, {
      "endpoint status is 200/204/404": (r) => [200, 204, 404].includes(r.status),
    });

    sleep(1);
  });
}