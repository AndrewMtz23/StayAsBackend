// models/payment.model.js
import { prisma } from "../config/db.js";

// ========================================
// PAGOS DE ACTIVIDADES
// ========================================

/**
 * Obtener todos los pagos de actividades con filtros
 */
export async function findAllActivityPayments(filters = {}) {
  return await prisma.paymentActivity.findMany({
    where: filters,
    include: {
      reservation: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          activity: {
            select: {
              id: true,
              title: true,
              price: true,
              city: true,
              state: true,
            },
          },
        },
      },
    },
    orderBy: { paymentDate: "desc" },
  });
}

/**
 * Obtener pago de actividad por ID
 */
export async function findActivityPaymentById(id) {
  return await prisma.paymentActivity.findUnique({
    where: { id: Number(id) },
    include: {
      reservation: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          activity: {
            select: {
              id: true,
              title: true,
              price: true,
              city: true,
              state: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Crear pago de actividad
 */
export async function createActivityPayment(data) {
  return await prisma.paymentActivity.create({
    data,
    include: {
      reservation: {
        include: {
          activity: {
            select: { id: true, title: true },
          },
        },
      },
    },
  });
}

/**
 * Actualizar pago de actividad
 */
export async function updateActivityPayment(id, data) {
  return await prisma.paymentActivity.update({
    where: { id: Number(id) },
    data,
  });
}

// ========================================
// PAGOS DE PROPIEDADES
// ========================================

/**
 * Obtener todos los pagos de propiedades con filtros
 */
export async function findAllPropertyPayments(filters = {}) {
  return await prisma.paymentProperty.findMany({
    where: filters,
    include: {
      reservation: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              city: true,
              state: true,
            },
          },
        },
      },
    },
    orderBy: { paymentDate: "desc" },
  });
}

/**
 * Obtener pago de propiedad por ID
 */
export async function findPropertyPaymentById(id) {
  return await prisma.paymentProperty.findUnique({
    where: { id: Number(id) },
    include: {
      reservation: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              city: true,
              state: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Crear pago de propiedad
 */
export async function createPropertyPayment(data) {
  return await prisma.paymentProperty.create({
    data,
    include: {
      reservation: {
        include: {
          property: {
            select: { id: true, title: true },
          },
        },
      },
    },
  });
}

/**
 * Actualizar pago de propiedad
 */
export async function updatePropertyPayment(id, data) {
  return await prisma.paymentProperty.update({
    where: { id: Number(id) },
    data,
  });
}