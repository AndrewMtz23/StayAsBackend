import { prisma } from "../config/db.js";

/**
 * Crear un nuevo log
 */
export async function createLog({
  userId,
  action,
  entity,
  entityId,
  description,
  ipAddress,
  userAgent
}) {
  return await prisma.systemLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      description,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Obtener todos los logs con filtros opcionales
 */
export async function findAllLogs({ 
  page = 1, 
  limit = 50, 
  action, 
  entity, 
  userId,
  startDate,
  endDate 
}) {
  const where = {};
  
  if (action) where.action = action;
  if (entity) where.entity = entity;
  if (userId) where.userId = Number(userId);
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.systemLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.systemLog.count({ where }),
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
}

/**
 * Obtener estadísticas de logs
 */
export async function getLogStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalLogs, todayLogs, actionStats, entityStats] = await Promise.all([
    prisma.systemLog.count(),
    prisma.systemLog.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    }),
    prisma.systemLog.groupBy({
      by: ['action'],
      _count: true,
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
      take: 10,
    }),
    prisma.systemLog.groupBy({
      by: ['entity'],
      _count: true,
      orderBy: {
        _count: {
          entity: 'desc',
        },
      },
    }),
  ]);

  return {
    totalLogs,
    todayLogs,
    actionStats,
    entityStats,
  };
}