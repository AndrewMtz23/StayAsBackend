// ============================================
// SEASONAL PRICE MODEL
// ============================================
// Este modelo maneja los PRECIOS DINÁMICOS POR TEMPORADA para propiedades.
// Permite definir incrementos o descuentos de precio en rangos de fechas específicos
// (temporada alta, fin de semana, festivos, eventos especiales, etc).
//
// CARACTERÍSTICAS:
// - Precios por porcentaje o monto fijo
// - Rangos de fechas flexibles
// - Sistema de prioridades (útil cuando se solapan temporadas)
// - Activación/desactivación sin eliminar
//
// CASOS DE USO:
// - Temporada alta (Navidad, Verano): +50%
// - Fin de semana: +20%
// - Temporada baja: -30%
// - Eventos especiales (conciertos, festivales): +100%
// ============================================

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class SeasonalPriceModel {
  // ============================================
  // CREAR PRECIO DE TEMPORADA
  // ============================================
  static async create(data) {
    return await prisma.seasonalPrice.create({
      data,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            basePrice: true,
          },
        },
      },
    });
  }

  // ============================================
  // BUSCAR POR ID
  // ============================================
  static async findById(id) {
    return await prisma.seasonalPrice.findUnique({
      where: { id: parseInt(id) },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            basePrice: true,
            userId: true,
          },
        },
      },
    });
  }

  // ============================================
  // BUSCAR TODOS LOS PRECIOS DE UNA PROPIEDAD
  // ============================================
  static async findByPropertyId(propertyId, filters = {}) {
    const where = {
      propertyId: parseInt(propertyId),
    };

    // Filtrar solo activos si se especifica
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return await prisma.seasonalPrice.findMany({
      where,
      orderBy: [
        { priority: 'desc' }, // Mayor prioridad primero
        { startDate: 'asc' },
      ],
      include: {
        property: {
          select: {
            id: true,
            title: true,
            basePrice: true,
          },
        },
      },
    });
  }

  // ============================================
  // BUSCAR PRECIOS ACTIVOS EN UNA FECHA
  // ============================================
  static async findActiveByDate(propertyId, date) {
    const targetDate = new Date(date);

    return await prisma.seasonalPrice.findMany({
      where: {
        propertyId: parseInt(propertyId),
        isActive: true,
        startDate: {
          lte: targetDate,
        },
        endDate: {
          gte: targetDate,
        },
      },
      orderBy: {
        priority: 'desc', // Mayor prioridad se aplica primero
      },
    });
  }

  // ============================================
  // BUSCAR PRECIOS EN RANGO DE FECHAS
  // ============================================
  static async findByDateRange(propertyId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return await prisma.seasonalPrice.findMany({
      where: {
        propertyId: parseInt(propertyId),
        isActive: true,
        OR: [
          // Caso 1: El precio de temporada comienza dentro del rango
          {
            startDate: {
              gte: start,
              lte: end,
            },
          },
          // Caso 2: El precio de temporada termina dentro del rango
          {
            endDate: {
              gte: start,
              lte: end,
            },
          },
          // Caso 3: El precio de temporada cubre todo el rango
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: end } },
            ],
          },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { startDate: 'asc' },
      ],
    });
  }

  // ============================================
  // ACTUALIZAR PRECIO DE TEMPORADA
  // ============================================
  static async update(id, data) {
    return await prisma.seasonalPrice.update({
      where: { id: parseInt(id) },
      data,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            basePrice: true,
          },
        },
      },
    });
  }

  // ============================================
  // ACTIVAR/DESACTIVAR PRECIO DE TEMPORADA
  // ============================================
  static async toggleActive(id, isActive) {
    return await prisma.seasonalPrice.update({
      where: { id: parseInt(id) },
      data: { isActive },
    });
  }

  // ============================================
  // ELIMINAR PRECIO DE TEMPORADA
  // ============================================
  static async delete(id) {
    return await prisma.seasonalPrice.delete({
      where: { id: parseInt(id) },
    });
  }

  // ============================================
  // BUSCAR PRECIOS SOLAPADOS (CONFLICTOS)
  // ============================================
  static async findOverlapping(propertyId, startDate, endDate, excludeId = null) {
    const where = {
      propertyId: parseInt(propertyId),
      isActive: true,
      OR: [
        {
          AND: [
            { startDate: { lte: new Date(startDate) } },
            { endDate: { gte: new Date(startDate) } },
          ],
        },
        {
          AND: [
            { startDate: { lte: new Date(endDate) } },
            { endDate: { gte: new Date(endDate) } },
          ],
        },
        {
          AND: [
            { startDate: { gte: new Date(startDate) } },
            { endDate: { lte: new Date(endDate) } },
          ],
        },
      ],
    };

    // Excluir un ID específico (útil al actualizar)
    if (excludeId) {
      where.id = { not: parseInt(excludeId) };
    }

    return await prisma.seasonalPrice.findMany({
      where,
      orderBy: { priority: 'desc' },
    });
  }

  // ============================================
  // LISTAR TODOS CON PAGINACIÓN
  // ============================================
  static async findAll(filters = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = {};

    if (filters.propertyId) {
      where.propertyId = parseInt(filters.propertyId);
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.priceType) {
      where.priceType = filters.priceType;
    }

    const [seasonalPrices, total] = await Promise.all([
      prisma.seasonalPrice.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { startDate: 'asc' },
        ],
        include: {
          property: {
            select: {
              id: true,
              title: true,
              basePrice: true,
            },
          },
        },
      }),
      prisma.seasonalPrice.count({ where }),
    ]);

    return {
      seasonalPrices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // ELIMINAR PRECIOS EXPIRADOS
  // ============================================
  static async deleteExpired() {
    const now = new Date();
    return await prisma.seasonalPrice.deleteMany({
      where: {
        endDate: {
          lt: now,
        },
        isActive: false, // Solo eliminar los que están inactivos
      },
    });
  }

  // ============================================
  // OBTENER ESTADÍSTICAS POR PROPIEDAD
  // ============================================
  static async getStatsByProperty(propertyId) {
    const stats = await prisma.seasonalPrice.groupBy({
      by: ['priceType', 'isActive'],
      where: {
        propertyId: parseInt(propertyId),
      },
      _count: true,
      _avg: {
        value: true,
      },
    });

    return stats;
  }
}

export default SeasonalPriceModel;