import { prisma } from "../config/db.js";
import { sendHostRequestNotification, sendHostApplicationForm, sendHostRequestApproved, sendHostRequestRejected } from "../config/email.js";

// ========================================
// CREAR SOLICITUD INICIAL (CLIENT)
// ========================================

/**
 * Cliente crea una solicitud inicial para convertirse en Host
 */
export async function createInitialHostRequest(userId, initialMessage) {
  // Verificar que el usuario existe y es CLIENT
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true }
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  if (user.role !== "CLIENT") {
    throw new Error("Solo los clientes pueden solicitar ser Host");
  }

  // Verificar que no tenga una solicitud activa
  const existingRequest = await prisma.hostRequest.findUnique({
    where: { userId: userId }
  });

  if (existingRequest) {
    if (existingRequest.status === "PENDING" || existingRequest.status === "IN_REVIEW") {
      throw new Error("Ya tienes una solicitud pendiente");
    }
    if (existingRequest.status === "APPROVED") {
      throw new Error("Tu solicitud ya fue aprobada");
    }
  }

  // Crear o actualizar solicitud
  const request = await prisma.hostRequest.upsert({
    where: { userId: userId },
    update: {
      initialMessage,
      status: "PENDING",
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null
    },
    create: {
      userId,
      initialMessage,
      status: "PENDING"
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Notificar a los empleados/admins
  try {
    await sendHostRequestNotification(user.name, user.email, initialMessage);
  } catch (error) {
    console.error("Error al enviar notificación:", error);
  }

  return request;
}

// ========================================
// OBTENER TODAS LAS SOLICITUDES (ADMIN/EMPLOYEE)
// ========================================

export async function getAllHostRequests(filters = {}) {
  const where = {};

  // Filtrar por estado
  if (filters.status) {
    where.status = filters.status;
  }

  // Filtrar por búsqueda (nombre o email)
  if (filters.search) {
    where.user = {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ]
    };
  }

  const requests = await prisma.hostRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          createdAt: true
        }
      }
    },
    orderBy: [
      { status: 'asc' }, // PENDING primero
      { submittedAt: 'desc' }
    ]
  });

  return requests;
}

// ========================================
// OBTENER SOLICITUD POR ID
// ========================================

export async function getHostRequestById(requestId) {
  const request = await prisma.hostRequest.findUnique({
    where: { id: Number(requestId) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          createdAt: true,
          role: true
        }
      }
    }
  });

  if (!request) {
    throw new Error("Solicitud no encontrada");
  }

  return request;
}

// ========================================
// OBTENER SOLICITUD DEL USUARIO
// ========================================

export async function getUserHostRequest(userId) {
  const request = await prisma.hostRequest.findUnique({
    where: { userId: Number(userId) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true
        }
      }
    }
  });

  return request;
}

// ========================================
// ENVIAR FORMULARIO AL CLIENTE (EMPLOYEE/ADMIN)
// ========================================

export async function sendApplicationFormToClient(requestId, employeeId) {
  const request = await getHostRequestById(requestId);

  if (request.status !== "PENDING") {
    throw new Error("Solo se puede enviar formulario a solicitudes pendientes");
  }

  // Actualizar estado a IN_REVIEW
  const updated = await prisma.hostRequest.update({
    where: { id: Number(requestId) },
    data: {
      status: "IN_REVIEW",
      reviewedBy: employeeId,
      reviewedAt: new Date()
    },
    include: {
      user: true
    }
  });

  // Enviar email con el enlace del formulario
  try {
    const formLink = `${process.env.FRONTEND_URL}/become-host/form`;
    await sendHostApplicationForm(
      updated.user.email,
      updated.user.name,
      formLink
    );
  } catch (error) {
    console.error("Error al enviar formulario:", error);
    throw new Error("Error al enviar el formulario por correo");
  }

  return updated;
}

// ========================================
// COMPLETAR FORMULARIO (CLIENT)
// ========================================

export async function completeHostApplicationForm(userId, formData) {
  const request = await prisma.hostRequest.findUnique({
    where: { userId: Number(userId) }
  });

  if (!request) {
    throw new Error("No tienes una solicitud activa");
  }

  if (request.status !== "IN_REVIEW") {
    throw new Error("Tu solicitud no está en revisión");
  }

  // Validaciones básicas
  if (!formData.motivation || formData.motivation.trim().length < 50) {
    throw new Error("La motivación debe tener al menos 50 caracteres");
  }

  if (!formData.phone || formData.phone.length < 10) {
    throw new Error("Teléfono inválido");
  }

  if (formData.hasProperty && !formData.propertyType) {
    throw new Error("Debes especificar el tipo de propiedad");
  }

  // Actualizar solicitud con los datos del formulario
  const updated = await prisma.hostRequest.update({
    where: { userId: Number(userId) },
    data: {
      motivation: formData.motivation,
      experience: formData.experience || null,
      phone: formData.phone,
      alternativeEmail: formData.alternativeEmail || null,
      hasProperty: formData.hasProperty || false,
      propertyType: formData.propertyType || null,
      propertyAddress: formData.propertyAddress || null,
      propertyCity: formData.propertyCity || null,
      propertyState: formData.propertyState || null,
      estimatedCapacity: formData.estimatedCapacity ? Number(formData.estimatedCapacity) : null,
      hasBusinessLicense: formData.hasBusinessLicense || false,
      taxId: formData.taxId || null,
      businessName: formData.businessName || null,
      availableFrom: formData.availableFrom ? new Date(formData.availableFrom) : null,
      identificationDoc: formData.identificationDoc || null,
      propertyPhotos: formData.propertyPhotos || [],
      additionalDocs: formData.additionalDocs || []
    },
    include: {
      user: true
    }
  });

  return updated;
}

// ========================================
// APROBAR SOLICITUD (EMPLOYEE/ADMIN)
// ========================================

export async function approveHostRequest(requestId, employeeId, adminNotes = null) {
  const request = await getHostRequestById(requestId);

  if (request.status === "APPROVED") {
    throw new Error("Esta solicitud ya fue aprobada");
  }

  // Verificar que el formulario esté completo
  if (!request.motivation || !request.phone) {
    throw new Error("El usuario debe completar el formulario antes de aprobar");
  }

  // Actualizar usuario a HOST y aprobar solicitud en una transacción
  const result = await prisma.$transaction(async (tx) => {
    // Actualizar usuario a HOST
    await tx.user.update({
      where: { id: request.userId },
      data: { role: "HOST" }
    });

    // Aprobar solicitud
    const approved = await tx.hostRequest.update({
      where: { id: Number(requestId) },
      data: {
        status: "APPROVED",
        reviewedBy: employeeId,
        reviewedAt: new Date(),
        adminNotes
      },
      include: {
        user: true
      }
    });

    return approved;
  });

  // Enviar email de aprobación
  try {
    await sendHostRequestApproved(
      result.user.email,
      result.user.name
    );
  } catch (error) {
    console.error("Error al enviar email de aprobación:", error);
  }

  return result;
}

// ========================================
// RECHAZAR SOLICITUD (EMPLOYEE/ADMIN)
// ========================================

export async function rejectHostRequest(requestId, employeeId, rejectionReason, adminNotes = null) {
  const request = await getHostRequestById(requestId);

  if (request.status === "APPROVED") {
    throw new Error("No se puede rechazar una solicitud aprobada");
  }

  if (!rejectionReason || rejectionReason.trim().length < 20) {
    throw new Error("Debes proporcionar una razón de rechazo de al menos 20 caracteres");
  }

  const rejected = await prisma.hostRequest.update({
    where: { id: Number(requestId) },
    data: {
      status: "REJECTED",
      reviewedBy: employeeId,
      reviewedAt: new Date(),
      rejectionReason,
      adminNotes
    },
    include: {
      user: true
    }
  });

  // Enviar email de rechazo
  try {
    await sendHostRequestRejected(
      rejected.user.email,
      rejected.user.name,
      rejectionReason
    );
  } catch (error) {
    console.error("Error al enviar email de rechazo:", error);
  }

  return rejected;
}

// ========================================
// AGREGAR NOTAS ADMINISTRATIVAS
// ========================================

export async function addAdminNotes(requestId, employeeId, adminNotes) {
  const updated = await prisma.hostRequest.update({
    where: { id: Number(requestId) },
    data: {
      adminNotes,
      reviewedBy: employeeId,
      reviewedAt: new Date()
    },
    include: {
      user: true
    }
  });

  return updated;
}

// ========================================
// ELIMINAR SOLICITUD (ADMIN)
// ========================================

export async function deleteHostRequest(requestId) {
  await prisma.hostRequest.delete({
    where: { id: Number(requestId) }
  });

  return { message: "Solicitud eliminada correctamente" };
}

// ========================================
// ESTADÍSTICAS DE SOLICITUDES
// ========================================

export async function getHostRequestStats() {
  const [total, pending, inReview, approved, rejected] = await Promise.all([
    prisma.hostRequest.count(),
    prisma.hostRequest.count({ where: { status: "PENDING" } }),
    prisma.hostRequest.count({ where: { status: "IN_REVIEW" } }),
    prisma.hostRequest.count({ where: { status: "APPROVED" } }),
    prisma.hostRequest.count({ where: { status: "REJECTED" } })
  ]);

  return {
    total,
    pending,
    inReview,
    approved,
    rejected
  };
}