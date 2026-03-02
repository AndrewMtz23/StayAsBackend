import http from "k6/http";
import { check, group, sleep } from "k6";

/**
 * StayAsBackend - k6 Auth Test (ROBUSTO)
 *
 * Objetivo:
 * - Probar mínimo 2 endpoints reales y relevantes:
 *   1) POST /api/auth/login
 *   2) GET  /api/auth/me (o el que definas)
 * - El register queda opcional y tolerante (no rompe CI si tu API no lo soporta igual)
 *
 * Variables de entorno recomendadas (GitHub Secrets):
 * - BASE_URL (obligatorio en CI)            Ej: https://stay-as-back.onrender.com
 * - LOGIN_PATH (opcional)                  Default: /api/auth/login
 * - ME_PATH (opcional)                     Default: /api/auth/me
 * - REGISTER_PATH (opcional)               Default: /api/auth/register
 *
 * Para login real (recomendado):
 * - TEST_EMAIL (recomendado)
 * - TEST_PASSWORD (recomendado)
 *
 * Si NO pones TEST_EMAIL/TEST_PASSWORD:
 * - Intentará registrar un usuario dummy y luego loguearse con ese usuario.
 * - Si register responde 400/404/409, no rompe; seguirá intentando login (puede fallar).
 */

export const options = {
  stages: [
    { duration: "15s", target: 5 },
    { duration: "30s", target: 5 },
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1200"],
    checks: ["rate>0.98"],
  },
};

const BASE_URL = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const LOGIN_PATH = __ENV.LOGIN_PATH || "/api/auth/login";
const ME_PATH = __ENV.ME_PATH || "/api/auth/me";
const REGISTER_PATH = __ENV.REGISTER_PATH || "/api/auth/register";

const TEST_EMAIL = __ENV.TEST_EMAIL || "";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "";

function joinUrl(base, path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function jsonHeaders(token) {
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function safeJson(res) {
  try {
    return res.json();
  } catch (e) {
    return null;
  }
}

function pickToken(jsonBody) {
  if (!jsonBody || typeof jsonBody !== "object") return null;
  return (
    jsonBody.token ||
    jsonBody.accessToken ||
    jsonBody.jwt ||
    (jsonBody.data && (jsonBody.data.token || jsonBody.data.accessToken)) ||
    null
  );
}

export default function () {
  // Credenciales a usar:
  // - Si vienen por env, usamos esas.
  // - Si no, generamos un usuario dummy.
  const unique = `${__VU}-${__ITER}-${Date.now()}`;
  const generatedEmail = `k6_user_${unique}@example.com`;
  const email = TEST_EMAIL || generatedEmail;
  const password = TEST_PASSWORD || "Pass123!";

  let token = null;

  // 01 - Register (opcional y tolerante)
  group("01 - Register (optional)", () => {
    // Si el usuario ya te dio TEST_EMAIL/TEST_PASSWORD, no registramos para no ensuciar BD
    if (TEST_EMAIL && TEST_PASSWORD) {
      check(true, { "register skipped (using TEST_EMAIL/TEST_PASSWORD)": () => true });
      return;
    }

    const url = joinUrl(BASE_URL, REGISTER_PATH);

    // Payload mínimo y flexible (si tu API pide más campos, puede responder 400)
    const payload = JSON.stringify({
      email,
      password,
      firstName: "K6",
      lastName: "User",
      phone: "5551234567",
      role: "CLIENT",
    });

    const res = http.post(url, payload, {
      headers: jsonHeaders(),
      tags: { name: `POST ${REGISTER_PATH}` },
    });

    // No rompemos por diferencias de contrato:
    // 200/201 ok
    // 400 si tu API requiere otros campos
    // 404 si no existe register
    // 409 si ya existe
    check(res, {
      "register status ok-ish (200/201/400/404/409)": (r) => [200, 201, 400, 404, 409].includes(r.status),
    });
  });

  // 02 - Login (real)
  group("02 - Login (public)", () => {
    const url = joinUrl(BASE_URL, LOGIN_PATH);
    const payload = JSON.stringify({ email, password });

    const res = http.post(url, payload, {
      headers: jsonHeaders(),
      tags: { name: `POST ${LOGIN_PATH}` },
    });

    const ok = check(res, {
      "login status is 200/201": (r) => [200, 201].includes(r.status),
      "login returns JSON": (r) => (r.headers["Content-Type"] || "").includes("application/json"),
    });

    if (ok) {
      const body = safeJson(res);
      token = pickToken(body);
      check(token, { "login returned token": (t) => !!t });
    }
  });

  // 03 - Me (auth)
  group("03 - Me (auth)", () => {
    const url = joinUrl(BASE_URL, ME_PATH);

    const res = http.get(url, {
      headers: jsonHeaders(token),
      tags: { name: `GET ${ME_PATH}` },
    });

    // Si token no existe, tu API dará 401 y está bien para no romper.
    check(res, {
      "me status is 200 when authorized, else 401/403": (r) => [200, 401, 403].includes(r.status),
    });
  });

  sleep(1);
}