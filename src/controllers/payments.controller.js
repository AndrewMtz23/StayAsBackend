import * as paymentService from "../services/payment.service.js";
import { logPaymentPDFDownloaded } from "../services/log.service.js";
import path from "path";
import { fileURLToPath } from "url";
import { generatePaymentPDF } from "../utils/pdfGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// CREAR PAGOS
// ========================================

/**
 * Crear pago para actividad
 */
export async function createActivityPayment(req, res) {
  try {
    const { reservationId, amount, method } = req.body;

    if (!reservationId || !amount || !method) {
      return res.status(400).json({
        message: "Faltan campos requeridos: reservationId, amount, method",
      });
    }

    const result = await paymentService.createActivityPayment(
      { reservationId, amount, method },
      req
    );

    return res.status(201).json({
      message: "Pago creado exitosamente",
      payment: result.payment,
    });
  } catch (error) {
    console.error("Error al crear pago:", error);
    return res.status(500).json({
      message: error.message || "Error al procesar el pago",
    });
  }
}

/**
 * Crear pago para propiedad
 */
export async function createPropertyPayment(req, res) {
  try {
    const { reservationId, amount, method } = req.body;

    if (!reservationId || !amount || !method) {
      return res.status(400).json({
        message: "Faltan campos requeridos: reservationId, amount, method",
      });
    }

    const result = await paymentService.createPropertyPayment(
      { reservationId, amount, method },
      req
    );

    return res.status(201).json({
      message: "Pago creado exitosamente",
      payment: result.payment,
    });
  } catch (error) {
    console.error("Error al crear pago:", error);
    return res.status(500).json({
      message: error.message || "Error al procesar el pago",
    });
  }
}

// ========================================
// DASHBOARD - OBTENER PAGOS
// ========================================

/**
 * Obtener todos los pagos con filtros (DASHBOARD)
 */
export async function getAllPayments(req, res) {
  try {
    const filters = {
      status: req.query.status,
      method: req.query.method,
      type: req.query.type, // 'activity' | 'property' | 'all'
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };

    const result = await paymentService.getAllPayments(filters, req);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    return res.status(500).json({
      message: "Error al obtener los pagos",
    });
  }
}

/**
 * Obtener un pago específico
 */
export async function getPaymentById(req, res) {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'activity' o 'property'

    if (!type || (type !== "activity" && type !== "property")) {
      return res.status(400).json({
        message: "Tipo de pago inválido. Debe ser 'activity' o 'property'",
      });
    }

    const payment = await paymentService.getPaymentById(
      parseInt(id),
      type,
      req
    );

    return res.status(200).json(payment);
  } catch (error) {
    console.error("Error al obtener pago:", error);
    return res.status(404).json({
      message: error.message || "Pago no encontrado",
    });
  }
}

/**
 * Obtener estadísticas de pagos
 */
export async function getPaymentStats(req, res) {
  try {
    const stats = await paymentService.getPaymentStats(req);

    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return res.status(500).json({
      message: "Error al obtener las estadísticas",
    });
  }
}

// ========================================
// ACTUALIZAR PAGOS
// ========================================

/**
 * Actualizar estado de pago
 */
export async function updatePaymentStatus(req, res) {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'activity' o 'property'
    const { status } = req.body;

    if (!type || (type !== "activity" && type !== "property")) {
      return res.status(400).json({
        message: "Tipo de pago inválido",
      });
    }

    if (!status) {
      return res.status(400).json({
        message: "El estado es requerido",
      });
    }

    const validStatuses = ["pending", "approved", "rejected", "refunded"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Estado inválido. Valores permitidos: ${validStatuses.join(", ")}`,
      });
    }

    const payment = await paymentService.updatePaymentStatus(
      parseInt(id),
      type,
      status,
      req
    );

    return res.status(200).json({
      message: "Estado del pago actualizado exitosamente",
      payment,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    return res.status(500).json({
      message: error.message || "Error al actualizar el estado del pago",
    });
  }
}

// ========================================
// REEMBOLSOS
// ========================================

/**
 * Reembolsar un pago
 */
export async function refundPayment(req, res) {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const { reason } = req.body;

    if (!type || (type !== "activity" && type !== "property")) {
      return res.status(400).json({
        message: "Tipo de pago inválido",
      });
    }

    const result = await paymentService.refundPayment(
      parseInt(id),
      type,
      reason,
      req
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al reembolsar pago:", error);
    return res.status(500).json({
      message: error.message || "Error al procesar el reembolso",
    });
  }
}

// ========================================
// DESCARGAR PDF
// ========================================

/**
 * Descargar comprobante PDF de actividad
 */
export async function downloadActivityPaymentPDF(req, res) {
  try {
    const { id } = req.params;

    const payment = await paymentService.getPaymentById(
      parseInt(id),
      "activity",
      req
    );

    if (!payment) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    // Generar PDF
    const pdfPath = await generatePaymentPDF(
      payment,
      payment.reservation,
      "activity"
    );

    // Log de descarga
    await logPaymentPDFDownloaded(req, parseInt(id), "activity", payment.folio);

    // Enviar archivo
    return res.download(pdfPath, `comprobante-${payment.folio}.pdf`);
  } catch (error) {
    console.error("Error al generar PDF:", error);
    return res.status(500).json({
      message: "Error al generar el comprobante PDF",
    });
  }
}

/**
 * Descargar comprobante PDF de propiedad
 */
export async function downloadPropertyPaymentPDF(req, res) {
  try {
    const { id } = req.params;

    const payment = await paymentService.getPaymentById(
      parseInt(id),
      "property",
      req
    );

    if (!payment) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    // Generar PDF
    const pdfPath = await generatePaymentPDF(
      payment,
      payment.reservation,
      "property"
    );

    // Log de descarga
    await logPaymentPDFDownloaded(req, parseInt(id), "property", payment.folio);

    // Enviar archivo
    return res.download(pdfPath, `comprobante-${payment.folio}.pdf`);
  } catch (error) {
    console.error("Error al generar PDF:", error);
    return res.status(500).json({
      message: "Error al generar el comprobante PDF",
    });
  }
}

export default {
  createActivityPayment,
  createPropertyPayment,
  getAllPayments,
  getPaymentById,
  getPaymentStats,
  updatePaymentStatus,
  refundPayment,
  downloadActivityPaymentPDF,
  downloadPropertyPaymentPDF,
};