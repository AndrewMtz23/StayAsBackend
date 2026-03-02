import http from "k6/http";
import { check, sleep, group } from "k6";

/**
 * K6 Load Test - StayAsBackend
 * - Simula interacción con 2 endpoints clave
 * - Usa BASE_URL por variable de entorno
 *
 * Ejecutar local:
 *   k6 run -e BASE_URL="http://localhost:3000" tests/k6/loadtest.js
 *
 * Ejecutar con Grafana Cloud Prometheus (remote write):
 *   k6 run --out experimental-prometheus-rw \
 *     -e BASE_URL="https://tu-api.com" \
 *     tests/k6/loadtest.js
 */

// Configuración de carga (ajústala a lo que te pidan)
export const options = {
  stages: [
    { duration: "20s", target: 5 },  // ramp-up
    { duration: "40s", target: 10 }, // steady
    { duration: "20s", target: 0 },  // ramp-down
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],       // <2% requests fallidas
    http_req_duration: ["p(95)<800"],     // 95% debajo de 800ms (ajusta)
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

/**
 * TIP:
 * Si tu API necesita auth, puedes:
 *  - guardar un token en GitHub Secrets y leerlo con __ENV.API_TOKEN
 *  - o hacer login en un endpoint y extraer token (si tu API lo soporta)
 */
const API_TOKEN = __ENV.API_TOKEN || ""; // opcional

function commonHeaders() {
  const h = { "Content-Type": "application/json" };
  if (API_TOKEN) h["Authorization"] = `Bearer ${API_TOKEN}`;
  return h;
}

export default function () {
  group("01 - Health / Ping", () => {
    const res = http.get(`${BASE_URL}/health`, { headers: commonHeaders() });

    check(res, {
      "health status is 200": (r) => r.status === 200,
      "health responds fast (<500ms)": (r) => r.timings.duration < 500,
    });

    sleep(1);
  });

  group("02 - Endpoint clave (listado / consulta)", () => {
    /**
     * Cambia este endpoint por uno real de tu app:
     * Ejemplos típicos:
     *  - /api/properties
     *  - /api/experiences
     *  - /api/users/me
     *  - /api/bookings
     */
    const res = http.get(`${BASE_URL}/api/properties`, { headers: commonHeaders() });

    check(res, {
      "endpoint status is 200": (r) => r.status === 200,
      "response has body": (r) => (r.body || "").length > 0,
    });

    sleep(1);
  });
}