import { PrismaClient } from "@prisma/client";
import {
  logPaymentCreated,
  logPaymentStatusChanged,
  logPaymentViewed,
  logPaymentPDFDownloaded,
  logPaymentRefunded,
  logPaymentStatsAccessed,
  logPaymentDashboardAccessed,
} from "./log.service.js";

const prisma = new PrismaClient();

// ========================================
// CREAR PAGO
// ========================================

/**
 * Crear pago para actividad
 */
export async function createActivityPayment(data, req) {
  const { reservationId, amount, method } = data;

  // Verificar que la reservación existe
  const reservation = await prisma.reservationActivity.findUnique({
    where: { id: reservationId },
    include: {
      activity: true,
      user: true,
    },
  });

  if (!reservation) {
    throw new Error("Reservación no encontrada");
  }

  // Verificar que no tenga pago previo
  const existingPayment = await prisma.paymentActivity.findUnique({
    where: { reservationId },
  });

  if (existingPayment) {
    throw new Error("Esta reservación ya tiene un pago asociado");
  }

  // Generar folio único
  const folio = `ACT-${Date.now()}-${reservationId}`;

  // Crear el pago
  const payment = await prisma.paymentActivity.create({
    data: {
      reservationId,
      amount,
      method,
      status: "approved", // Pago aprobado automáticamente (simulado)
      folio,
    },
  });

  // Actualizar el estado de la reservación
  await prisma.reservationActivity.update({
    where: { id: reservationId },
    data: { status: "confirmed" },
  });

  // Log de creación
  await logPaymentCreated(req, payment, "activity", reservation);

  return { payment, reservation };
}

/**
 * Crear pago para propiedad
 */
export async function createPropertyPayment(data, req) {
  const { reservationId, amount, method } = data;

  // Verificar que la reservación existe
  const reservation = await prisma.reservationProperty.findUnique({
    where: { id: reservationId },
    include: {
      property: true,
      user: true,
    },
  });

  if (!reservation) {
    throw new Error("Reservación no encontrada");
  }

  // Verificar que no tenga pago previo
  const existingPayment = await prisma.paymentProperty.findUnique({
    where: { reservationId },
  });

  if (existingPayment) {
    throw new Error("Esta reservación ya tiene un pago asociado");
  }

  // Generar folio único
  const folio = `PROP-${Date.now()}-${reservationId}`;

  // Crear el pago
  const payment = await prisma.paymentProperty.create({
    data: {
      reservationId,
      amount,
      method,
      status: "approved",
      folio,
    },
  });

  // Actualizar el estado de la reservación
  await prisma.reservationProperty.update({
    where: { id: reservationId },
    data: { status: "confirmed" },
  });

  // Log de creación
  await logPaymentCreated(req, payment, "property", reservation);

  return { payment, reservation };
}

// ========================================
// OBTENER PAGOS - DASHBOARD
// ========================================

/**
 * Obtener todos los pagos (activities + properties) con filtros
 */
export async function getAllPayments(filters = {}, req) {
  const {
    status,
    method,
    type, // 'activity' | 'property' | 'all'
    startDate,
    endDate,
    search, // buscar por folio o usuario
    page = 1,
    limit = 10,
  } = filters;

  const skip = (page - 1) * limit;

  // Construir where clause
  const baseWhere = {};
  
  if (status) baseWhere.status = status;
  if (method) baseWhere.method = method;
  
  if (startDate || endDate) {
    baseWhere.paymentDate = {};
    if (startDate) baseWhere.paymentDate.gte = new Date(startDate);
    if (endDate) baseWhere.paymentDate.lte = new Date(endDate);
  }

  // Si hay búsqueda por folio
  if (search) {
    baseWhere.folio = {
      contains: search,
      mode: 'insensitive',
    };
  }

  let activityPayments = [];
  let propertyPayments = [];

  // Obtener pagos de actividades
  if (type === "activity" || type === "all" || !type) {
    activityPayments = await prisma.paymentActivity.findMany({
      where: baseWhere,
      include: {
        reservation: {
          include: {
            activity: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
      skip: type === "activity" ? skip : 0,
      take: type === "activity" ? limit : undefined,
    });

    // Agregar campo 'type' para identificarlos
    activityPayments = activityPayments.map((p) => ({
      ...p,
      type: "activity",
      itemTitle: p.reservation?.activity?.title || "N/A",
      userName: p.reservation?.user?.name || "N/A",
      userEmail: p.reservation?.user?.email || "N/A",
    }));
  }

  // Obtener pagos de propiedades
  if (type === "property" || type === "all" || !type) {
    propertyPayments = await prisma.paymentProperty.findMany({
      where: baseWhere,
      include: {
        reservation: {
          include: {
            property: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
      skip: type === "property" ? skip : 0,
      take: type === "property" ? limit : undefined,
    });

    propertyPayments = propertyPayments.map((p) => ({
      ...p,
      type: "property",
      itemTitle: p.reservation?.property?.title || "N/A",
      userName: p.reservation?.user?.name || "N/A",
      userEmail: p.reservation?.user?.email || "N/A",
    }));
  }

  // Combinar y ordenar
  let allPayments = [...activityPayments, ...propertyPayments];

  // Si buscamos por nombre de usuario, filtrar
  if (search && !search.includes('ACT-') && !search.includes('PROP-')) {
    allPayments = allPayments.filter(p => 
      p.userName.toLowerCase().includes(search.toLowerCase()) ||
      p.userEmail.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Ordenar por fecha
  allPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

  // Paginar si es 'all'
  if (type === "all" || !type) {
    const start = skip;
    const end = start + limit;
    allPayments = allPayments.slice(start, end);
  }

  // Contar totales
  const totalActivity = await prisma.paymentActivity.count({ where: baseWhere });
  const totalProperty = await prisma.paymentProperty.count({ where: baseWhere });
  const total = totalActivity + totalProperty;

  // Log de acceso
  await logPaymentDashboardAccessed(req, filters);

  return {
    payments: allPayments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Obtener un pago específico
 */
export async function getPaymentById(id, type, req) {
  let payment;

  if (type === "activity") {
    payment = await prisma.paymentActivity.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            activity: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  } else {
    payment = await prisma.paymentProperty.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            property: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  if (!payment) {
    throw new Error("Pago no encontrado");
  }

  // Log de visualización
  await logPaymentViewed(req, id, type, payment.folio);

  return { ...payment, type };
}

/**
 * Actualizar estado de pago
 */
export async function updatePaymentStatus(id, type, newStatus, req) {
  let payment;

  // Obtener el pago actual
  if (type === "activity") {
    payment = await prisma.paymentActivity.findUnique({
      where: { id },
    });
  } else {
    payment = await prisma.paymentProperty.findUnique({
      where: { id },
    });
  }

  if (!payment) {
    throw new Error("Pago no encontrado");
  }

  const oldStatus = payment.status;

  // Actualizar el estado
  if (type === "activity") {
    payment = await prisma.paymentActivity.update({
      where: { id },
      data: { status: newStatus },
    });
  } else {
    payment = await prisma.paymentProperty.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  // Log de cambio de estado
  await logPaymentStatusChanged(req, id, oldStatus, newStatus, type);

  return payment;
}

// ========================================
// ESTADÍSTICAS
// ========================================

/**
 * Obtener estadísticas de pagos
 */
export async function getPaymentStats(req) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay()); // Domingo
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // TOTALES GENERALES
  const totalActivityPayments = await prisma.paymentActivity.count();
  const totalPropertyPayments = await prisma.paymentProperty.count();
  const totalPayments = totalActivityPayments + totalPropertyPayments;

  // INGRESOS TOTALES
  const activityRevenue = await prisma.paymentActivity.aggregate({
    _sum: { amount: true },
    where: { status: "approved" },
  });

  const propertyRevenue = await prisma.paymentProperty.aggregate({
    _sum: { amount: true },
    where: { status: "approved" },
  });

  const totalRevenue =
    (activityRevenue._sum.amount || 0) + (propertyRevenue._sum.amount || 0);

  // INGRESOS DE HOY
  const todayActivityRevenue = await prisma.paymentActivity.aggregate({
    _sum: { amount: true },
    where: {
      status: "approved",
      paymentDate: { gte: today },
    },
  });

  const todayPropertyRevenue = await prisma.paymentProperty.aggregate({
    _sum: { amount: true },
    where: {
      status: "approved",
      paymentDate: { gte: today },
    },
  });

  const todayRevenue =
    (todayActivityRevenue._sum.amount || 0) +
    (todayPropertyRevenue._sum.amount || 0);

  // INGRESOS DE ESTA SEMANA
  const weekActivityRevenue = await prisma.paymentActivity.aggregate({
    _sum: { amount: true },
    where: {
      status: "approved",
      paymentDate: { gte: thisWeekStart },
    },
  });

  const weekPropertyRevenue = await prisma.paymentProperty.aggregate({
    _sum: { amount: true },
    where: {
      status: "approved",
      paymentDate: { gte: thisWeekStart },
    },
  });

  const weekRevenue =
    (weekActivityRevenue._sum.amount || 0) +
    (weekPropertyRevenue._sum.amount || 0);

  // INGRESOS DE ESTE MES
  const monthActivityRevenue = await prisma.paymentActivity.aggregate({
    _sum: { amount: true },
    where: {
      status: "approved",
      paymentDate: { gte: thisMonthStart },
    },
  });

  const monthPropertyRevenue = await prisma.paymentProperty.aggregate({
    _sum: { amount: true },
    where: {
      status: "approved",
      paymentDate: { gte: thisMonthStart },
    },
  });

  const monthRevenue =
    (monthActivityRevenue._sum.amount || 0) +
    (monthPropertyRevenue._sum.amount || 0);

  // PAGOS POR ESTADO
  const activityByStatus = await prisma.paymentActivity.groupBy({
    by: ["status"],
    _count: true,
  });

  const propertyByStatus = await prisma.paymentProperty.groupBy({
    by: ["status"],
    _count: true,
  });

  const paymentsByStatus = {};
  [...activityByStatus, ...propertyByStatus].forEach((item) => {
    if (!paymentsByStatus[item.status]) {
      paymentsByStatus[item.status] = 0;
    }
    paymentsByStatus[item.status] += item._count;
  });

  // PAGOS POR MÉTODO
  const activityByMethod = await prisma.paymentActivity.groupBy({
    by: ["method"],
    _count: true,
  });

  const propertyByMethod = await prisma.paymentProperty.groupBy({
    by: ["method"],
    _count: true,
  });

  const paymentsByMethod = {};
  [...activityByMethod, ...propertyByMethod].forEach((item) => {
    if (!paymentsByMethod[item.method]) {
      paymentsByMethod[item.method] = 0;
    }
    paymentsByMethod[item.method] += item._count;
  });

  // INGRESOS POR MÉTODO
  const activityRevenueByMethod = await prisma.paymentActivity.groupBy({
    by: ["method"],
    _sum: { amount: true },
    where: { status: "approved" },
  });

  const propertyRevenueByMethod = await prisma.paymentProperty.groupBy({
    by: ["method"],
    _sum: { amount: true },
    where: { status: "approved" },
  });

  const revenueByMethod = {};
  [...activityRevenueByMethod, ...propertyRevenueByMethod].forEach((item) => {
    if (!revenueByMethod[item.method]) {
      revenueByMethod[item.method] = 0;
    }
    revenueByMethod[item.method] += Number(item._sum.amount || 0);
  });

  // INGRESOS POR DÍA (últimos 30 días)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const activityDailyRevenue = await prisma.paymentActivity.findMany({
    where: {
      status: "approved",
      paymentDate: { gte: thirtyDaysAgo },
    },
    select: {
      paymentDate: true,
      amount: true,
    },
  });

  const propertyDailyRevenue = await prisma.paymentProperty.findMany({
    where: {
      status: "approved",
      paymentDate: { gte: thirtyDaysAgo },
    },
    select: {
      paymentDate: true,
      amount: true,
    },
  });

  // Agrupar por día
  const dailyRevenue = {};
  [...activityDailyRevenue, ...propertyDailyRevenue].forEach((payment) => {
    const date = new Date(payment.paymentDate).toISOString().split("T")[0];
    if (!dailyRevenue[date]) {
      dailyRevenue[date] = 0;
    }
    dailyRevenue[date] += Number(payment.amount);
  });

  // Convertir a array ordenado
  const dailyRevenueArray = Object.keys(dailyRevenue)
    .sort()
    .map((date) => ({
      date,
      revenue: dailyRevenue[date],
    }));

  // PAGOS PENDIENTES
  const pendingActivityPayments = await prisma.paymentActivity.count({
    where: { status: "pending" },
  });

  const pendingPropertyPayments = await prisma.paymentProperty.count({
    where: { status: "pending" },
  });

  const pendingPayments = pendingActivityPayments + pendingPropertyPayments;

  // Log de acceso a estadísticas
  await logPaymentStatsAccessed(req);

  return {
    overview: {
      totalPayments,
      totalRevenue: Number(totalRevenue),
      todayRevenue: Number(todayRevenue),
      weekRevenue: Number(weekRevenue),
      monthRevenue: Number(monthRevenue),
      pendingPayments,
      totalActivityPayments,
      totalPropertyPayments,
    },
    byStatus: paymentsByStatus,
    byMethod: {
      count: paymentsByMethod,
      revenue: revenueByMethod,
    },
    dailyRevenue: dailyRevenueArray,
  };
}

// ========================================
// REEMBOLSOS
// ========================================

/**
 * Reembolsar un pago
 */
export async function refundPayment(id, type, reason, req) {
  let payment;

  // Obtener el pago
  if (type === "activity") {
    payment = await prisma.paymentActivity.findUnique({
      where: { id },
      include: { reservation: true },
    });
  } else {
    payment = await prisma.paymentProperty.findUnique({
      where: { id },
      include: { reservation: true },
    });
  }

  if (!payment) {
    throw new Error("Pago no encontrado");
  }

  if (payment.status === "refunded") {
    throw new Error("Este pago ya fue reembolsado");
  }

  // Actualizar el pago
  if (type === "activity") {
    await prisma.paymentActivity.update({
      where: { id },
      data: { status: "refunded" },
    });

    // Cancelar la reservación
    await prisma.reservationActivity.update({
      where: { id: payment.reservationId },
      data: { status: "cancelled" },
    });
  } else {
    await prisma.paymentProperty.update({
      where: { id },
      data: { status: "refunded" },
    });

    await prisma.reservationProperty.update({
      where: { id: payment.reservationId },
      data: { status: "cancelled" },
    });
  }

  // Log de reembolso
  await logPaymentRefunded(req, id, payment.amount, type, reason);

  return { success: true, message: "Pago reembolsado exitosamente" };
}

export default {
  createActivityPayment,
  createPropertyPayment,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentStats,
  refundPayment,
};