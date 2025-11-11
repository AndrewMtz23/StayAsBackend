import { PrismaClient } from "@prisma/client";
import {
  logReservationDashboardAccessed,
  logReservationStatsAccessed,
  logReservationViewed,
  logReservationStatusUpdated,
  logReservationConfirmed,
  logReservationCompleted,
} from "./log.service.js";

const prisma = new PrismaClient();

// ========================================
// OBTENER TODAS LAS RESERVACIONES - DASHBOARD
// ========================================

/**
 * Obtener todas las reservaciones (activities + properties) con filtros
 */
export async function getAllReservations(filters = {}, req) {
  const {
    status,
    type, // 'activity' | 'property' | 'all'
    userId,
    startDate,
    endDate,
    search, // buscar por nombre de usuario o email
    page = 1,
    limit = 10,
  } = filters;

  const skip = (page - 1) * limit;

  // Construir where clause
  const baseWhere = {};
  
  if (status) baseWhere.status = status;
  if (userId) baseWhere.userId = Number(userId);
  
  if (startDate || endDate) {
    baseWhere.createdAt = {};
    if (startDate) baseWhere.createdAt.gte = new Date(startDate);
    if (endDate) baseWhere.createdAt.lte = new Date(endDate);
  }

  let activityReservations = [];
  let propertyReservations = [];

  // Obtener reservaciones de actividades
  if (type === "activity" || type === "all" || !type) {
    const activityWhere = { ...baseWhere };
    
    activityReservations = await prisma.reservationActivity.findMany({
      where: activityWhere,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            city: true,
            state: true,
            media: {
              orderBy: [{ order: "asc" }, { id: "asc" }],
              take: 1,
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            folio: true,
            paymentDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: type === "activity" ? skip : 0,
      take: type === "activity" ? limit : undefined,
    });

    // Agregar campo 'type' para identificarlos
    activityReservations = activityReservations.map((r) => ({
      ...r,
      type: "activity",
      itemTitle: r.activity?.title || "N/A",
      itemImage: r.activity?.media?.[0]?.url || null,
      userName: r.user?.name || "N/A",
      userEmail: r.user?.email || "N/A",
    }));
  }

  // Obtener reservaciones de propiedades
  if (type === "property" || type === "all" || !type) {
    const propertyWhere = { ...baseWhere };
    
    propertyReservations = await prisma.reservationProperty.findMany({
      where: propertyWhere,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            price: true,
            city: true,
            state: true,
            media: {
              orderBy: [{ order: "asc" }, { id: "asc" }],
              take: 1,
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            folio: true,
            paymentDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: type === "property" ? skip : 0,
      take: type === "property" ? limit : undefined,
    });

    propertyReservations = propertyReservations.map((r) => ({
      ...r,
      type: "property",
      itemTitle: r.property?.title || "N/A",
      itemImage: r.property?.media?.[0]?.url || null,
      userName: r.user?.name || "N/A",
      userEmail: r.user?.email || "N/A",
    }));
  }

  // Combinar y ordenar
  let allReservations = [...activityReservations, ...propertyReservations];

  // Si buscamos por nombre de usuario, filtrar
  if (search) {
    allReservations = allReservations.filter(r => 
      r.userName.toLowerCase().includes(search.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      r.itemTitle.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Ordenar por fecha
  allReservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Paginar si es 'all'
  if (type === "all" || !type) {
    const start = skip;
    const end = start + limit;
    allReservations = allReservations.slice(start, end);
  }

  // Contar totales
  const totalActivity = await prisma.reservationActivity.count({ where: baseWhere });
  const totalProperty = await prisma.reservationProperty.count({ where: baseWhere });
  const total = totalActivity + totalProperty;

  // Log de acceso
  await logReservationDashboardAccessed(req, filters);

  return {
    reservations: allReservations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ========================================
// OBTENER UNA RESERVACIÓN POR ID
// ========================================

/**
 * Obtener una reservación específica
 */
export async function getReservationById(id, type, req) {
  let reservation;

  if (type === "activity") {
    reservation = await prisma.reservationActivity.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        activity: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            media: {
              orderBy: [{ order: "asc" }, { id: "asc" }],
            },
          },
        },
        payment: true,
      },
    });
  } else {
    reservation = await prisma.reservationProperty.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        property: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            media: {
              orderBy: [{ order: "asc" }, { id: "asc" }],
            },
          },
        },
        payment: true,
      },
    });
  }

  if (!reservation) {
    throw new Error("Reservación no encontrada");
  }

  // Log de visualización
  await logReservationViewed(req, id, type);

  return { ...reservation, type };
}

// ========================================
// ACTUALIZAR ESTADO DE RESERVACIÓN
// ========================================

/**
 * Actualizar estado de reservación
 */
export async function updateReservationStatus(id, type, newStatus, req) {
  let reservation;

  // Obtener la reservación actual
  if (type === "activity") {
    reservation = await prisma.reservationActivity.findUnique({
      where: { id: Number(id) },
    });
  } else {
    reservation = await prisma.reservationProperty.findUnique({
      where: { id: Number(id) },
    });
  }

  if (!reservation) {
    throw new Error("Reservación no encontrada");
  }

  const oldStatus = reservation.status;

  // Actualizar el estado
  if (type === "activity") {
    reservation = await prisma.reservationActivity.update({
      where: { id: Number(id) },
      data: { status: newStatus },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        activity: {
          select: { id: true, title: true },
        },
      },
    });
  } else {
    reservation = await prisma.reservationProperty.update({
      where: { id: Number(id) },
      data: { status: newStatus },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        property: {
          select: { id: true, title: true },
        },
      },
    });
  }

  // Log específico según el nuevo estado
  if (newStatus === "confirmed") {
    await logReservationConfirmed(req, id, type);
  } else if (newStatus === "completed") {
    await logReservationCompleted(req, id, type);
  } else {
    await logReservationStatusUpdated(req, id, oldStatus, newStatus, type);
  }

  return reservation;
}

// ========================================
// ESTADÍSTICAS
// ========================================

/**
 * Obtener estadísticas de reservaciones
 */
export async function getReservationStats(req) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay()); // Domingo
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // TOTALES GENERALES
  const totalActivityReservations = await prisma.reservationActivity.count();
  const totalPropertyReservations = await prisma.reservationProperty.count();
  const totalReservations = totalActivityReservations + totalPropertyReservations;

  // RESERVACIONES DE HOY
  const todayActivityCount = await prisma.reservationActivity.count({
    where: { createdAt: { gte: today } },
  });

  const todayPropertyCount = await prisma.reservationProperty.count({
    where: { createdAt: { gte: today } },
  });

  const todayReservations = todayActivityCount + todayPropertyCount;

  // RESERVACIONES DE ESTA SEMANA
  const weekActivityCount = await prisma.reservationActivity.count({
    where: { createdAt: { gte: thisWeekStart } },
  });

  const weekPropertyCount = await prisma.reservationProperty.count({
    where: { createdAt: { gte: thisWeekStart } },
  });

  const weekReservations = weekActivityCount + weekPropertyCount;

  // RESERVACIONES DE ESTE MES
  const monthActivityCount = await prisma.reservationActivity.count({
    where: { createdAt: { gte: thisMonthStart } },
  });

  const monthPropertyCount = await prisma.reservationProperty.count({
    where: { createdAt: { gte: thisMonthStart } },
  });

  const monthReservations = monthActivityCount + monthPropertyCount;

  // RESERVACIONES POR ESTADO
  const activityByStatus = await prisma.reservationActivity.groupBy({
    by: ["status"],
    _count: true,
  });

  const propertyByStatus = await prisma.reservationProperty.groupBy({
    by: ["status"],
    _count: true,
  });

  const reservationsByStatus = {};
  [...activityByStatus, ...propertyByStatus].forEach((item) => {
    if (!reservationsByStatus[item.status]) {
      reservationsByStatus[item.status] = 0;
    }
    reservationsByStatus[item.status] += item._count;
  });

  // RESERVACIONES POR DÍA (últimos 30 días)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const activityDaily = await prisma.reservationActivity.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
    },
  });

  const propertyDaily = await prisma.reservationProperty.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
    },
  });

  // Agrupar por día
  const dailyCount = {};
  [...activityDaily, ...propertyDaily].forEach((reservation) => {
    const date = new Date(reservation.createdAt).toISOString().split("T")[0];
    if (!dailyCount[date]) {
      dailyCount[date] = 0;
    }
    dailyCount[date]++;
  });

  // Convertir a array ordenado
  const dailyReservations = Object.keys(dailyCount)
    .sort()
    .map((date) => ({
      date,
      count: dailyCount[date],
    }));

  // ACTIVIDADES/PROPIEDADES MÁS RESERVADAS
  const topActivities = await prisma.reservationActivity.groupBy({
    by: ["activityId"],
    _count: true,
    orderBy: {
      _count: {
        activityId: "desc",
      },
    },
    take: 5,
  });

  const topActivitiesWithDetails = await Promise.all(
    topActivities.map(async (item) => {
      const activity = await prisma.activity.findUnique({
        where: { id: item.activityId },
        select: { id: true, title: true },
      });
      return {
        id: item.activityId,
        title: activity?.title || "N/A",
        count: item._count,
      };
    })
  );

  const topProperties = await prisma.reservationProperty.groupBy({
    by: ["propertyId"],
    _count: true,
    orderBy: {
      _count: {
        propertyId: "desc",
      },
    },
    take: 5,
  });

  const topPropertiesWithDetails = await Promise.all(
    topProperties.map(async (item) => {
      const property = await prisma.property.findUnique({
        where: { id: item.propertyId },
        select: { id: true, title: true },
      });
      return {
        id: item.propertyId,
        title: property?.title || "N/A",
        count: item._count,
      };
    })
  );

  // Log de acceso a estadísticas
  await logReservationStatsAccessed(req);

  return {
    overview: {
      totalReservations,
      todayReservations,
      weekReservations,
      monthReservations,
      totalActivityReservations,
      totalPropertyReservations,
      pendingReservations: reservationsByStatus.pending || 0,
      confirmedReservations: reservationsByStatus.confirmed || 0,
    },
    byStatus: reservationsByStatus,
    dailyReservations,
    topActivities: topActivitiesWithDetails,
    topProperties: topPropertiesWithDetails,
  };
}

export default {
  getAllReservations,
  getReservationById,
  updateReservationStatus,
  getReservationStats,
};