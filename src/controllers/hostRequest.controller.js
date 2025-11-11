import {
  createInitialHostRequest,
  getAllHostRequests,
  getHostRequestById,
  getUserHostRequest,
  sendApplicationFormToClient,
  completeHostApplicationForm,
  approveHostRequest,
  rejectHostRequest,
  addAdminNotes,
  deleteHostRequest,
  getHostRequestStats
} from "../services/hostRequest.service.js";
import {
  logHostRequestCreated,
  logHostRequestApproved,
  logHostRequestRejected,
  logHostRequestDeleted
} from "../services/log.service.js";

// ========================================
// CREAR SOLICITUD INICIAL (CLIENT)
// ========================================

/**
 * POST /api/host-requests
 * Cliente crea solicitud inicial para ser Host
 */
export async function createHostRequest(req, res) {
  try {
    const userId = req.user.id;
    const { initialMessage } = req.body;

    if (!initialMessage || initialMessage.trim().length < 50) {
      return res.status(400).json({ 
        error: "El mensaje debe tener al menos 50 caracteres" 
      });
    }

    const request = await createInitialHostRequest(userId, initialMessage);

    // Log de creación
    await logHostRequestCreated(req, request.id, request.user.name);

    res.status(201).json({
      message: "Solicitud creada exitosamente. Te contactaremos pronto.",
      request
    });
  } catch (err) {
    console.error("Error al crear solicitud:", err);
    res.status(400).json({ error: err.message });
  }
}

// ========================================
// OBTENER TODAS LAS SOLICITUDES (EMPLOYEE/ADMIN)
// ========================================

/**
 * GET /api/host-requests
 * Obtener todas las solicitudes con filtros opcionales
 * Query params: status, search
 */
export async function getHostRequests(req, res) {
  try {
    const { status, search } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;

    const requests = await getAllHostRequests(filters);

    res.status(200).json({
      count: requests.length,
      requests
    });
  } catch (err) {
    console.error("Error al obtener solicitudes:", err);
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
}

// ========================================
// OBTENER SOLICITUD POR ID (EMPLOYEE/ADMIN)
// ========================================

/**
 * GET /api/host-requests/:id
 * Obtener detalles de una solicitud específica
 */
export async function getHostRequest(req, res) {
  try {
    const { id } = req.params;
    const request = await getHostRequestById(id);

    res.status(200).json(request);
  } catch (err) {
    console.error("Error al obtener solicitud:", err);
    res.status(404).json({ error: err.message });
  }
}

// ========================================
// OBTENER MI SOLICITUD (CLIENT)
// ========================================

/**
 * GET /api/host-requests/my-request
 * Cliente obtiene su propia solicitud
 */
export async function getMyHostRequest(req, res) {
  try {
    const userId = req.user.id;
    const request = await getUserHostRequest(userId);

    if (!request) {
      return res.status(404).json({ 
        message: "No tienes una solicitud activa" 
      });
    }

    res.status(200).json(request);
  } catch (err) {
    console.error("Error al obtener solicitud:", err);
    res.status(500).json({ error: "Error al obtener solicitud" });
  }
}

// ========================================
// ENVIAR FORMULARIO AL CLIENTE (EMPLOYEE/ADMIN)
// ========================================

/**
 * POST /api/host-requests/:id/send-form
 * Empleado envía formulario de aplicación al cliente
 */
export async function sendForm(req, res) {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;

    const request = await sendApplicationFormToClient(id, employeeId);

    res.status(200).json({
      message: "Formulario enviado correctamente al cliente",
      request
    });
  } catch (err) {
    console.error("Error al enviar formulario:", err);
    res.status(400).json({ error: err.message });
  }
}

// ========================================
// COMPLETAR FORMULARIO (CLIENT)
// ========================================

/**
 * PUT /api/host-requests/complete-form
 * Cliente completa el formulario de aplicación
 */
export async function completeForm(req, res) {
  try {
    const userId = req.user.id;
    const formData = req.body;

    const request = await completeHostApplicationForm(userId, formData);

    res.status(200).json({
      message: "Formulario completado exitosamente",
      request
    });
  } catch (err) {
    console.error("Error al completar formulario:", err);
    res.status(400).json({ error: err.message });
  }
}

// ========================================
// APROBAR SOLICITUD (EMPLOYEE/ADMIN)
// ========================================

/**
 * POST /api/host-requests/:id/approve
 * Empleado/Admin aprueba la solicitud y convierte al usuario en HOST
 */
export async function approveRequest(req, res) {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;
    const { adminNotes } = req.body;

    const request = await approveHostRequest(id, employeeId, adminNotes);

    // Log de aprobación
    await logHostRequestApproved(req, parseInt(id), request.user.name);

    res.status(200).json({
      message: "Solicitud aprobada. El usuario ahora es HOST.",
      request
    });
  } catch (err) {
    console.error("Error al aprobar solicitud:", err);
    res.status(400).json({ error: err.message });
  }
}

// ========================================
// RECHAZAR SOLICITUD (EMPLOYEE/ADMIN)
// ========================================

/**
 * POST /api/host-requests/:id/reject
 * Empleado/Admin rechaza la solicitud
 */
export async function rejectRequest(req, res) {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ 
        error: "Debes proporcionar una razón de rechazo" 
      });
    }

    const request = await rejectHostRequest(id, employeeId, rejectionReason, adminNotes);

    // Log de rechazo
    await logHostRequestRejected(req, parseInt(id), request.user.name, rejectionReason);

    res.status(200).json({
      message: "Solicitud rechazada",
      request
    });
  } catch (err) {
    console.error("Error al rechazar solicitud:", err);
    res.status(400).json({ error: err.message });
  }
}

// ========================================
// AGREGAR NOTAS (EMPLOYEE/ADMIN)
// ========================================

/**
 * PUT /api/host-requests/:id/notes
 * Agregar o actualizar notas administrativas
 */
export async function updateNotes(req, res) {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;
    const { adminNotes } = req.body;

    if (!adminNotes) {
      return res.status(400).json({ error: "Las notas no pueden estar vacías" });
    }

    const request = await addAdminNotes(id, employeeId, adminNotes);

    res.status(200).json({
      message: "Notas actualizadas",
      request
    });
  } catch (err) {
    console.error("Error al actualizar notas:", err);
    res.status(400).json({ error: err.message });
  }
}

// ========================================
// ELIMINAR SOLICITUD (ADMIN O DUEÑO SI ESTÁ RECHAZADA)
// ========================================

/**
 * DELETE /api/host-requests/:id
 * Admin puede eliminar cualquier solicitud
 * Usuario puede eliminar su propia solicitud si está RECHAZADA
 */
export async function removeHostRequest(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Obtener datos antes de eliminar para el log
    const request = await getHostRequestById(id);

    // Verificar permisos:
    // - Si es ADMIN, puede eliminar cualquier solicitud
    // - Si es el dueño, solo puede eliminar si está RECHAZADA
    const isAdmin = userRole === "ADMIN";
    const isOwner = request.userId === userId;
    const isRejected = request.status === "REJECTED";

    if (!isAdmin && (!isOwner || !isRejected)) {
      return res.status(403).json({ 
        error: "No tienes permiso para eliminar esta solicitud. Solo puedes eliminar tu propia solicitud si ha sido rechazada." 
      });
    }
    
    const result = await deleteHostRequest(id);

    // Log de eliminación
    await logHostRequestDeleted(req, parseInt(id), request.user.name);

    res.status(200).json(result);
  } catch (err) {
    console.error("Error al eliminar solicitud:", err);
    res.status(400).json({ error: err.message });
  }
}

// ========================================
// ESTADÍSTICAS (ADMIN/EMPLOYEE)
// ========================================

/**
 * GET /api/host-requests/stats
 * Obtener estadísticas de solicitudes
 */
export async function getStats(req, res) {
  try {
    const stats = await getHostRequestStats();
    res.status(200).json(stats);
  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
}