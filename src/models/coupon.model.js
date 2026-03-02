// ============================================
// RUTA: backend/models/coupon.model.js
// ============================================
// Modelo de Cupones - Maneja la lógica de datos
// de cupones de descuento para el sistema
// ============================================

import { prisma } from "../config/db.js";

/**
 * Crear un nuevo cupón
 * @param {Object} data - Datos del cupón
 * @returns {Promise<Object>} - Cupón creado
 */
export const createCoupon = async (data) => {
  return await prisma.coupon.create({
    data: {
      code: data.code.toUpperCase(), // Convertir a mayúsculas
      description: data.description,
      type: data.type,
      value: data.value,
      minPurchase: data.minPurchase || null,
      maxDiscount: data.maxDiscount || null,
      validFrom: new Date(data.validFrom),
      validUntil: new Date(data.validUntil),
      usageLimit: data.usageLimit || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      appliesTo: data.appliesTo || "ALL",
      createdBy: data.createdBy || null,
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

/**
 * Obtener todos los cupones con filtros
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>} - Lista de cupones
 */
export const getAllCoupons = async (filters = {}) => {
  const where = {};

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.appliesTo) {
    where.appliesTo = filters.appliesTo;
  }

  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  // Filtrar por cupones actualmente válidos
  if (filters.currentlyValid) {
    const now = new Date();
    where.validFrom = { lte: now };
    where.validUntil = { gte: now };
    where.isActive = true;
  }

  return await prisma.coupon.findMany({
    where,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          orders: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Obtener un cupón por ID
 * @param {number} id - ID del cupón
 * @returns {Promise<Object|null>} - Cupón encontrado
 */
export const getCouponById = async (id) => {
  return await prisma.coupon.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });
};

/**
 * Obtener un cupón por código
 * @param {string} code - Código del cupón
 * @returns {Promise<Object|null>} - Cupón encontrado
 */
export const getCouponByCode = async (code) => {
  return await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

/**
 * Actualizar un cupón
 * @param {number} id - ID del cupón
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} - Cupón actualizado
 */
export const updateCoupon = async (id, data) => {
  const updateData = {};

  if (data.code) updateData.code = data.code.toUpperCase();
  if (data.description) updateData.description = data.description;
  if (data.type) updateData.type = data.type;
  if (data.value !== undefined) updateData.value = data.value;
  if (data.minPurchase !== undefined) updateData.minPurchase = data.minPurchase;
  if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;
  if (data.validFrom) updateData.validFrom = new Date(data.validFrom);
  if (data.validUntil) updateData.validUntil = new Date(data.validUntil);
  if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.appliesTo) updateData.appliesTo = data.appliesTo;

  return await prisma.coupon.update({
    where: { id },
    data: updateData,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

/**
 * Eliminar un cupón
 * @param {number} id - ID del cupón
 * @returns {Promise<Object>} - Cupón eliminado
 */
export const deleteCoupon = async (id) => {
  return await prisma.coupon.delete({
    where: { id },
  });
};

/**
 * Activar/desactivar un cupón
 * @param {number} id - ID del cupón
 * @param {boolean} isActive - Estado activo
 * @returns {Promise<Object>} - Cupón actualizado
 */
export const toggleCouponStatus = async (id, isActive) => {
  return await prisma.coupon.update({
    where: { id },
    data: { isActive },
  });
};

/**
 * Incrementar el contador de usos de un cupón
 * @param {number} id - ID del cupón
 * @returns {Promise<Object>} - Cupón actualizado
 */
export const incrementUsageCount = async (id) => {
  return await prisma.coupon.update({
    where: { id },
    data: {
      usedCount: {
        increment: 1,
      },
    },
  });
};

/**
 * Verificar si un cupón es válido
 * @param {string} code - Código del cupón
 * @returns {Promise<Object>} - { valid: boolean, coupon: Object, reason: string }
 */
export const validateCoupon = async (code) => {
  const coupon = await getCouponByCode(code);

  if (!coupon) {
    return {
      valid: false,
      coupon: null,
      reason: "Cupón no encontrado",
    };
  }

  // Verificar si está activo
  if (!coupon.isActive) {
    return {
      valid: false,
      coupon,
      reason: "Cupón inactivo",
    };
  }

  // Verificar fechas de validez
  const now = new Date();
  if (now < coupon.validFrom) {
    return {
      valid: false,
      coupon,
      reason: "Cupón aún no es válido",
    };
  }

  if (now > coupon.validUntil) {
    return {
      valid: false,
      coupon,
      reason: "Cupón expirado",
    };
  }

  // Verificar límite de uso
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return {
      valid: false,
      coupon,
      reason: "Cupón ha alcanzado su límite de uso",
    };
  }

  return {
    valid: true,
    coupon,
    reason: "Cupón válido",
  };
};

/**
 * Calcular descuento basado en cupón y monto
 * @param {Object} coupon - Objeto cupón
 * @param {number} amount - Monto total
 * @returns {number} - Descuento calculado
 */
export const calculateDiscount = (coupon, amount) => {
  let discount = 0;

  if (coupon.type === "PERCENTAGE") {
    // Descuento porcentual
    discount = (amount * parseFloat(coupon.value)) / 100;

    // Aplicar límite máximo de descuento si existe
    if (coupon.maxDiscount && discount > parseFloat(coupon.maxDiscount)) {
      discount = parseFloat(coupon.maxDiscount);
    }
  } else if (coupon.type === "FIXED_AMOUNT") {
    // Descuento de cantidad fija
    discount = parseFloat(coupon.value);

    // El descuento no puede ser mayor al monto total
    if (discount > amount) {
      discount = amount;
    }
  }

  return discount;
};

/**
 * Obtener cupones activos y vigentes
 * @param {string} appliesTo - Filtro opcional: ALL, ACTIVITY, PROPERTY
 * @returns {Promise<Array>} - Lista de cupones activos
 */
export const getActiveCoupons = async (appliesTo = null) => {
  const now = new Date();
  const where = {
    isActive: true,
    validFrom: { lte: now },
    validUntil: { gte: now },
  };

  if (appliesTo) {
    where.OR = [{ appliesTo: appliesTo }, { appliesTo: "ALL" }];
  }

  return await prisma.coupon.findMany({
    where,
    select: {
      id: true,
      code: true,
      description: true,
      type: true,
      value: true,
      minPurchase: true,
      maxDiscount: true,
      validFrom: true,
      validUntil: true,
      usageLimit: true,
      usedCount: true,
      appliesTo: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Verificar si un usuario ya usó un cupón
 * @param {number} userId - ID del usuario
 * @param {number} couponId - ID del cupón
 * @returns {Promise<boolean>} - true si ya lo usó
 */
export const hasUserUsedCoupon = async (userId, couponId) => {
  const usage = await prisma.orderCoupon.findFirst({
    where: {
      userId,
      couponId,
    },
  });

  return !!usage;
};

/**
 * Obtener estadísticas de cupones
 * @returns {Promise<Object>} - Estadísticas
 */
export const getCouponStats = async () => {
  const total = await prisma.coupon.count();
  const active = await prisma.coupon.count({
    where: { isActive: true },
  });

  const now = new Date();
  const valid = await prisma.coupon.count({
    where: {
      isActive: true,
      validFrom: { lte: now },
      validUntil: { gte: now },
    },
  });

  const totalUsage = await prisma.coupon.aggregate({
    _sum: {
      usedCount: true,
    },
  });

  return {
    total,
    active,
    valid,
    totalUsage: totalUsage._sum.usedCount || 0,
  };
};

export default {
  createCoupon,
  getAllCoupons,
  getCouponById,
  getCouponByCode,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  incrementUsageCount,
  validateCoupon,
  calculateDiscount,
  getActiveCoupons,
  hasUserUsedCoupon,
  getCouponStats,
};