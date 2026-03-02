import { prisma } from "../config/db.js";

// ========================================
// ESTADÍSTICAS GENERALES DEL DASHBOARD
// ========================================

/**
 * Obtener todas las estadísticas del dashboard admin
 */
export async function getAdminDashboardStats() {
  try {
    // Fechas útiles
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // ========================================
    // 1. USUARIOS
    // ========================================
    const totalUsers = await prisma.user.count();
    const verifiedUsers = await prisma.user.count({
      where: { isVerified: true },
    });
    const usersThisMonth = await prisma.user.count({
      where: {
        createdAt: { gte: thisMonthStart },
      },
    });

    // Usuarios por rol
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    // ========================================
    // 2. PROPIEDADES
    // ========================================
    const totalProperties = await prisma.property.count();
    const activeProperties = await prisma.property.count({
      where: { 
        availability: true,
        status: "APPROVED"
      },
    });
    const pendingProperties = await prisma.property.count({
      where: { status: "PENDING" },
    });
    const propertiesThisMonth = await prisma.property.count({
      where: {
        createdAt: { gte: thisMonthStart },
      },
    });

    // Propiedades por tipo
    const propertiesByType = await prisma.property.groupBy({
      by: ["type"],
      _count: true,
    });

    // ========================================
    // 3. ACTIVIDADES
    // ========================================
    const totalActivities = await prisma.activity.count();
    const activeActivities = await prisma.activity.count({
      where: { availability: true },
    });
    const activitiesThisMonth = await prisma.activity.count({
      where: {
        createdAt: { gte: thisMonthStart },
      },
    });

    // Actividades por tipo
    const activitiesByType = await prisma.activity.groupBy({
      by: ["type"],
      _count: true,
    });

    // ========================================
    // 4. RESERVACIONES
    // ========================================
    const totalActivityReservations = await prisma.reservationActivity.count();
    const totalPropertyReservations = await prisma.reservationProperty.count();
    const totalReservations = totalActivityReservations + totalPropertyReservations;

    // Reservaciones este mes
    const activityReservationsThisMonth = await prisma.reservationActivity.count({
      where: {
        createdAt: { gte: thisMonthStart },
      },
    });
    const propertyReservationsThisMonth = await prisma.reservationProperty.count({
      where: {
        createdAt: { gte: thisMonthStart },
      },
    });
    const reservationsThisMonth = activityReservationsThisMonth + propertyReservationsThisMonth;

    // Reservaciones mes pasado
    const activityReservationsLastMonth = await prisma.reservationActivity.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });
    const propertyReservationsLastMonth = await prisma.reservationProperty.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });
    const reservationsLastMonth = activityReservationsLastMonth + propertyReservationsLastMonth;

    // Calcular crecimiento
    const reservationGrowth = reservationsLastMonth > 0
      ? ((reservationsThisMonth - reservationsLastMonth) / reservationsLastMonth) * 100
      : 0;

    // Reservaciones por estado
    const activityReservationsByStatus = await prisma.reservationActivity.groupBy({
      by: ["status"],
      _count: true,
    });
    const propertyReservationsByStatus = await prisma.reservationProperty.groupBy({
      by: ["status"],
      _count: true,
    });

    const reservationsByStatus = {};
    [...activityReservationsByStatus, ...propertyReservationsByStatus].forEach((item) => {
      if (!reservationsByStatus[item.status]) {
        reservationsByStatus[item.status] = 0;
      }
      reservationsByStatus[item.status] += item._count;
    });

    // ========================================
    // 5. REVIEWS Y SATISFACCIÓN
    // ========================================
    const activityReviews = await prisma.reviewActivity.findMany({
      select: { rating: true },
    });
    const propertyReviews = await prisma.reviewProperty.findMany({
      select: { rating: true },
    });

    const allRatings = [
      ...activityReviews.map((r) => r.rating),
      ...propertyReviews.map((r) => r.rating),
    ];

    const averageRating = allRatings.length > 0
      ? (allRatings.reduce((acc, rating) => acc + rating, 0) / allRatings.length).toFixed(1)
      : "0.0";

    const totalReviews = allRatings.length;

    // ========================================
    // 6. RESERVACIONES POR MES (últimos 12 meses)
    // ========================================
    const monthlyReservations = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const activityCount = await prisma.reservationActivity.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const propertyCount = await prisma.reservationProperty.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      monthlyReservations.push({
        month: monthStart.toLocaleDateString("es-MX", { month: "short" }),
        count: activityCount + propertyCount,
      });
    }

    // ========================================
    // 7. PAGOS
    // ========================================
    const activityPayments = await prisma.paymentActivity.findMany({
      select: { amount: true, status: true },
    });
    const propertyPayments = await prisma.paymentProperty.findMany({
      select: { amount: true, status: true },
    });

    const approvedActivityPayments = activityPayments.filter((p) => p.status === "approved");
    const approvedPropertyPayments = propertyPayments.filter((p) => p.status === "approved");

    const totalRevenue =
      [...approvedActivityPayments, ...approvedPropertyPayments].reduce(
        (acc, payment) => acc + Number(payment.amount),
        0
      );

    // Pagos este mes
    const activityPaymentsThisMonth = await prisma.paymentActivity.findMany({
      where: {
        paymentDate: { gte: thisMonthStart },
        status: "approved",
      },
      select: { amount: true },
    });
    const propertyPaymentsThisMonth = await prisma.paymentProperty.findMany({
      where: {
        paymentDate: { gte: thisMonthStart },
        status: "approved",
      },
      select: { amount: true },
    });

    const revenueThisMonth =
      [...activityPaymentsThisMonth, ...propertyPaymentsThisMonth].reduce(
        (acc, payment) => acc + Number(payment.amount),
        0
      );

    // ========================================
    // 8. HOST REQUESTS
    // ========================================
    const pendingHostRequests = await prisma.hostRequest.count({
      where: { status: "PENDING" },
    });

    const approvedHostRequests = await prisma.hostRequest.count({
      where: { status: "APPROVED" },
    });

    // ========================================
    // 9. TOP PROPIEDADES Y ACTIVIDADES
    // ========================================
    const topProperties = await prisma.property.findMany({
      take: 5,
      orderBy: { viewCount: "desc" },
      select: {
        id: true,
        title: true,
        viewCount: true,
        city: true,
      },
    });

    const topActivities = await prisma.activity.findMany({
      take: 5,
      orderBy: { viewCount: "desc" },
      select: {
        id: true,
        title: true,
        viewCount: true,
        city: true,
      },
    });

    // ========================================
    // RETORNAR TODAS LAS ESTADÍSTICAS
    // ========================================
    return {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        thisMonth: usersThisMonth,
        byRole: usersByRole,
      },
      properties: {
        total: totalProperties,
        active: activeProperties,
        pending: pendingProperties,
        thisMonth: propertiesThisMonth,
        byType: propertiesByType,
      },
      activities: {
        total: totalActivities,
        active: activeActivities,
        thisMonth: activitiesThisMonth,
        byType: activitiesByType,
      },
      reservations: {
        total: totalReservations,
        thisMonth: reservationsThisMonth,
        lastMonth: reservationsLastMonth,
        growth: reservationGrowth.toFixed(1),
        byStatus: reservationsByStatus,
        monthly: monthlyReservations,
      },
      reviews: {
        total: totalReviews,
        averageRating: parseFloat(averageRating),
      },
      revenue: {
        total: totalRevenue,
        thisMonth: revenueThisMonth,
      },
      hostRequests: {
        pending: pendingHostRequests,
        approved: approvedHostRequests,
      },
      top: {
        properties: topProperties,
        activities: topActivities,
      },
    };
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    throw error;
  }
}

export default {
  getAdminDashboardStats,
};