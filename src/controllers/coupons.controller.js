// ============================================
// RUTA: backend/controllers/coupons.controller.js
// ============================================
// Controlador de Cupones - Maneja peticiones HTTP
// Recibe requests, llama al servicio, devuelve respuestas
// ============================================

import * as couponService from "../services/coupon.service.js";

/**
 * POST /api/coupons
 * Crear un nuevo cupón (ADMIN, EMPLOYEE)
 * Body: { code, description, type, value, validFrom, validUntil, ... }
 */
export const createCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;

    const coupon = await couponService.createNewCoupon(data, userId);

    res.status(201).json({
      success: true,
      message: "Cupón creado exitosamente",
      data: coupon,
    });
  } catch (error) {
    console.error("❌ Error al crear cupón:", error);

    if (
      error.message.includes("Ya existe") ||
      error.message.includes("Campos requeridos")
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Error al crear cupón",
    });
  }
};

/**
 * GET /api/coupons
 * Obtener todos los cupones con filtros (ADMIN, EMPLOYEE)
 * Query: ?isActive=true&appliesTo=ACTIVITY&search=VERANO&currentlyValid=true
 */
export const getAllCoupons = async (req, res) => {
  try {
    const filters = {
      isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
      appliesTo: req.query.appliesTo || null,
      search: req.query.search || null,
      currentlyValid: req.query.currentlyValid === "true" ? true : false,
    };

    const coupons = await couponService.getAllCoupons(filters);

    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    console.error("❌ Error al obtener cupones:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error al obtener cupones",
    });
  }
};

/**
 * GET /api/coupons/public
 * Obtener cupones activos públicamente disponibles (PÚBLICO)
 * Query: ?appliesTo=ACTIVITY|PROPERTY
 */
export const getPublicCoupons = async (req, res) => {
  try {
    const appliesTo = req.query.appliesTo || null;

    const coupons = await couponService.getPublicActiveCoupons(appliesTo);

    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    console.error("❌ Error al obtener cupones públicos:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error al obtener cupones",
    });
  }
};

/**
 * GET /api/coupons/stats
 * Obtener estadísticas de cupones (ADMIN, EMPLOYEE)
 */
export const getCouponStats = async (req, res) => {
  try {
    const stats = await couponService.getCouponStatistics();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error al obtener estadísticas",
    });
  }
};

/**
 * GET /api/coupons/:id
 * Obtener un cupón por ID (ADMIN, EMPLOYEE)
 */
export const getCouponById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "ID de cupón inválido",
      });
    }

    const coupon = await couponService.getCouponById(id);

    res.status(200).json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error("❌ Error al obtener cupón:", error);

    if (error.message.includes("no encontrado")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Error al obtener cupón",
    });
  }
};

/**
 * PUT /api/coupons/:id
 * Actualizar un cupón (ADMIN, EMPLOYEE)
 * Body: Campos a actualizar
 */
export const updateCoupon = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "ID de cupón inválido",
      });
    }

    const coupon = await couponService.updateCoupon(id, data);

    res.status(200).json({
      success: true,
      message: "Cupón actualizado exitosamente",
      data: coupon,
    });
  } catch (error) {
    console.error("❌ Error al actualizar cupón:", error);

    if (error.message.includes("no encontrado")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes("Ya existe")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Error al actualizar cupón",
    });
  }
};

/**
 * DELETE /api/coupons/:id
 * Eliminar un cupón (ADMIN)
 */
export const deleteCoupon = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "ID de cupón inválido",
      });
    }

    const result = await couponService.deleteCoupon(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("❌ Error al eliminar cupón:", error);

    if (error.message.includes("no encontrado")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes("No se puede eliminar")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Error al eliminar cupón",
    });
  }
};

/**
 * PATCH /api/coupons/:id/toggle
 * Activar/Desactivar un cupón (ADMIN, EMPLOYEE)
 * Body: { isActive: boolean }
 */
export const toggleCoupon = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "ID de cupón inválido",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "isActive debe ser un valor booleano",
      });
    }

    const coupon = await couponService.toggleCouponStatus(id, isActive);

    res.status(200).json({
      success: true,
      message: `Cupón ${isActive ? "activado" : "desactivado"} exitosamente`,
      data: coupon,
    });
  } catch (error) {
    console.error("❌ Error al cambiar estado del cupón:", error);

    if (error.message.includes("no encontrado")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Error al cambiar estado del cupón",
    });
  }
};

/**
 * POST /api/coupons/validate
 * Validar y aplicar un cupón (TODOS AUTENTICADOS)
 * Body: { code, amount, itemType }
 */
export const validateCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code, amount, itemType } = req.body;

    // Validar campos requeridos
    if (!code || !amount) {
      return res.status(400).json({
        success: false,
        error: "code y amount son requeridos",
      });
    }

    // Validar que amount sea número
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "amount debe ser un número mayor a 0",
      });
    }

    const result = await couponService.validateAndApplyCoupon(
      code,
      parsedAmount,
      userId,
      itemType || "ALL"
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ Error al validar cupón:", error);

    // Errores de validación (cupón expirado, no válido, etc.)
    if (
      error.message.includes("no encontrado") ||
      error.message.includes("inactivo") ||
      error.message.includes("expirado") ||
      error.message.includes("límite") ||
      error.message.includes("ya has usado") ||
      error.message.includes("compra mínima") ||
      error.message.includes("solo aplica")
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Error al validar cupón",
    });
  }
};

export default {
  createCoupon,
  getAllCoupons,
  getPublicCoupons,
  getCouponStats,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  toggleCoupon,
  validateCoupon,
};