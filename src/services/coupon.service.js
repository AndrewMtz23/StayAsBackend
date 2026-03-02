// ============================================
// RUTA: backend/services/coupon.service.js
// ============================================
// Servicio de Cupones - Lógica de negocio
// Validaciones y reglas antes de interactuar con BD
// ============================================

import * as couponModel from "../models/coupon.model.js";

/**
 * Crear un nuevo cupón
 * @param {Object} data - Datos del cupón
 * @param {number} createdBy - ID del usuario que crea el cupón
 * @returns {Promise<Object>}
 */
export const createNewCoupon = async (data, createdBy) => {
  // Validar campos requeridos
  if (!data.code || !data.description || !data.type || !data.value) {
    throw new Error(
      "Campos requeridos: code, description, type, value, validFrom, validUntil"
    );
  }

  if (!data.validFrom || !data.validUntil) {
    throw new Error("Las fechas validFrom y validUntil son requeridas");
  }

  // Validar tipo de cupón
  if (!["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"].includes(data.type)) {
    throw new Error(
      "Tipo de cupón inválido. Debe ser: PERCENTAGE, FIXED_AMOUNT o FREE_SHIPPING"
    );
  }

  // Validar valor según tipo
  if (data.type === "PERCENTAGE") {
    if (data.value <= 0 || data.value > 100) {
      throw new Error("El porcentaje debe estar entre 1 y 100");
    }
  } else if (data.type === "FIXED_AMOUNT") {
    if (data.value <= 0) {
      throw new Error("El monto fijo debe ser mayor a 0");
    }
  }

  // Validar que el código no exista
  const existing = await couponModel.getCouponByCode(data.code);
  if (existing) {
    throw new Error("Ya existe un cupón con este código");
  }

  // Validar fechas
  const validFrom = new Date(data.validFrom);
  const validUntil = new Date(data.validUntil);

  if (validFrom >= validUntil) {
    throw new Error("La fecha de inicio debe ser anterior a la fecha de fin");
  }

  // Validar appliesTo
  if (data.appliesTo && !["ALL", "ACTIVITY", "PROPERTY"].includes(data.appliesTo)) {
    throw new Error("appliesTo debe ser: ALL, ACTIVITY o PROPERTY");
  }

  // Crear cupón
  const couponData = {
    ...data,
    createdBy,
  };

  const coupon = await couponModel.createCoupon(couponData);

  return formatCouponResponse(coupon);
};

/**
 * Obtener todos los cupones con filtros
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>}
 */
export const getAllCoupons = async (filters = {}) => {
  const coupons = await couponModel.getAllCoupons(filters);

  return coupons.map((coupon) => formatCouponResponse(coupon));
};

/**
 * Obtener cupón por ID
 * @param {number} id - ID del cupón
 * @returns {Promise<Object>}
 */
export const getCouponById = async (id) => {
  const coupon = await couponModel.getCouponById(id);

  if (!coupon) {
    throw new Error("Cupón no encontrado");
  }

  return formatCouponResponse(coupon);
};

/**
 * Actualizar un cupón
 * @param {number} id - ID del cupón
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>}
 */
export const updateCoupon = async (id, data) => {
  // Verificar que existe
  const existing = await couponModel.getCouponById(id);
  if (!existing) {
    throw new Error("Cupón no encontrado");
  }

  // Si se actualiza el código, verificar que no exista
  if (data.code && data.code.toUpperCase() !== existing.code) {
    const codeExists = await couponModel.getCouponByCode(data.code);
    if (codeExists) {
      throw new Error("Ya existe un cupón con este código");
    }
  }

  // Validar tipo si se actualiza
  if (data.type && !["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"].includes(data.type)) {
    throw new Error("Tipo de cupón inválido");
  }

  // Validar valor si se actualiza
  if (data.value !== undefined) {
    const type = data.type || existing.type;
    if (type === "PERCENTAGE" && (data.value <= 0 || data.value > 100)) {
      throw new Error("El porcentaje debe estar entre 1 y 100");
    } else if (type === "FIXED_AMOUNT" && data.value <= 0) {
      throw new Error("El monto fijo debe ser mayor a 0");
    }
  }

  // Validar fechas si se actualizan
  if (data.validFrom || data.validUntil) {
    const validFrom = data.validFrom
      ? new Date(data.validFrom)
      : existing.validFrom;
    const validUntil = data.validUntil
      ? new Date(data.validUntil)
      : existing.validUntil;

    if (validFrom >= validUntil) {
      throw new Error("La fecha de inicio debe ser anterior a la fecha de fin");
    }
  }

  // Validar appliesTo si se actualiza
  if (data.appliesTo && !["ALL", "ACTIVITY", "PROPERTY"].includes(data.appliesTo)) {
    throw new Error("appliesTo debe ser: ALL, ACTIVITY o PROPERTY");
  }

  const coupon = await couponModel.updateCoupon(id, data);

  return formatCouponResponse(coupon);
};

/**
 * Eliminar un cupón
 * @param {number} id - ID del cupón
 * @returns {Promise<Object>}
 */
export const deleteCoupon = async (id) => {
  const existing = await couponModel.getCouponById(id);
  if (!existing) {
    throw new Error("Cupón no encontrado");
  }

  // Verificar si ha sido usado
  if (existing.usedCount > 0) {
    throw new Error(
      "No se puede eliminar un cupón que ya ha sido usado. Considera desactivarlo en su lugar."
    );
  }

  await couponModel.deleteCoupon(id);

  return {
    success: true,
    message: "Cupón eliminado correctamente",
  };
};

/**
 * Activar/Desactivar cupón
 * @param {number} id - ID del cupón
 * @param {boolean} isActive - Estado activo
 * @returns {Promise<Object>}
 */
export const toggleCouponStatus = async (id, isActive) => {
  const existing = await couponModel.getCouponById(id);
  if (!existing) {
    throw new Error("Cupón no encontrado");
  }

  const coupon = await couponModel.toggleCouponStatus(id, isActive);

  return formatCouponResponse(coupon);
};

/**
 * Validar y aplicar cupón
 * @param {string} code - Código del cupón
 * @param {number} amount - Monto total de la compra
 * @param {number} userId - ID del usuario
 * @param {string} itemType - Tipo de item: ACTIVITY, PROPERTY, ALL
 * @returns {Promise<Object>}
 */
export const validateAndApplyCoupon = async (
  code,
  amount,
  userId,
  itemType = "ALL"
) => {
  // Validar cupón
  const validation = await couponModel.validateCoupon(code);

  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  const coupon = validation.coupon;

  // Verificar que el cupón aplique al tipo de item
  if (coupon.appliesTo !== "ALL" && coupon.appliesTo !== itemType) {
    throw new Error(
      `Este cupón solo aplica para ${coupon.appliesTo === "ACTIVITY" ? "experiencias" : "alojamientos"}`
    );
  }

  // Verificar compra mínima
  if (coupon.minPurchase && amount < parseFloat(coupon.minPurchase)) {
    throw new Error(
      `La compra mínima para este cupón es de $${coupon.minPurchase}`
    );
  }

  // Verificar si el usuario ya usó este cupón
  const hasUsed = await couponModel.hasUserUsedCoupon(userId, coupon.id);
  if (hasUsed) {
    throw new Error("Ya has usado este cupón anteriormente");
  }

  // Calcular descuento
  const discount = couponModel.calculateDiscount(coupon, amount);

  return {
    valid: true,
    coupon: formatCouponResponse(coupon),
    discount: parseFloat(discount.toFixed(2)),
    finalAmount: parseFloat((amount - discount).toFixed(2)),
    message: "Cupón aplicado exitosamente",
  };
};

/**
 * Obtener cupones activos públicos
 * @param {string} appliesTo - Filtro opcional: ALL, ACTIVITY, PROPERTY
 * @returns {Promise<Array>}
 */
export const getPublicActiveCoupons = async (appliesTo = null) => {
  const coupons = await couponModel.getActiveCoupons(appliesTo);

  return coupons.map((coupon) => ({
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: parseFloat(coupon.value),
    minPurchase: coupon.minPurchase
      ? parseFloat(coupon.minPurchase)
      : null,
    maxDiscount: coupon.maxDiscount
      ? parseFloat(coupon.maxDiscount)
      : null,
    validUntil: coupon.validUntil,
    appliesTo: coupon.appliesTo,
    remainingUses:
      coupon.usageLimit !== null
        ? coupon.usageLimit - coupon.usedCount
        : null,
  }));
};

/**
 * Obtener estadísticas de cupones
 * @returns {Promise<Object>}
 */
export const getCouponStatistics = async () => {
  return await couponModel.getCouponStats();
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Formatear respuesta de cupón
 * @param {Object} coupon - Cupón de BD
 * @returns {Object}
 */
const formatCouponResponse = (coupon) => {
  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: parseFloat(coupon.value),
    minPurchase: coupon.minPurchase ? parseFloat(coupon.minPurchase) : null,
    maxDiscount: coupon.maxDiscount ? parseFloat(coupon.maxDiscount) : null,
    validFrom: coupon.validFrom,
    validUntil: coupon.validUntil,
    usageLimit: coupon.usageLimit,
    usedCount: coupon.usedCount,
    remainingUses:
      coupon.usageLimit !== null
        ? coupon.usageLimit - coupon.usedCount
        : null,
    isActive: coupon.isActive,
    appliesTo: coupon.appliesTo,
    createdBy: coupon.creator
      ? {
          id: coupon.creator.id,
          name: coupon.creator.name,
          email: coupon.creator.email,
        }
      : null,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
    totalOrders: coupon._count?.orders || 0,
  };
};

export default {
  createNewCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateAndApplyCoupon,
  getPublicActiveCoupons,
  getCouponStatistics,
};