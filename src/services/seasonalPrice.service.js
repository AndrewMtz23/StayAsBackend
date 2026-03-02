// ============================================
// SEASONAL PRICE SERVICE
// ============================================
// Este servicio contiene la LÓGICA DE NEGOCIO para gestionar precios por temporada.
//
// FUNCIONES PRINCIPALES:
// 1. Crear/editar/eliminar precios de temporada
// 2. CALCULAR precio final aplicando temporadas activas
// 3. Validar conflictos de fechas
// 4. Aplicar prioridades cuando hay solapamiento
// 5. Generar precios para rangos de fechas
//
// LÓGICA DE CÁLCULO:
// - Se aplica la temporada con MAYOR PRIORIDAD si hay solapamiento
// - Los precios pueden ser PORCENTAJE (+30%) o FIJO (+$500)
// - Se respeta el precio base de la propiedad
//
// EJEMPLO DE USO:
// Precio base: $1000/noche
// Temporada Alta (Dic 20-31): +50% = $1500/noche
// Fin de Semana: +20% = $1200/noche
// Si ambas coinciden → Se aplica la de mayor prioridad
// ============================================

import SeasonalPriceModel from './seasonalPrice.model.js';
import PropertyModel from './property.model.js';

class SeasonalPriceService {
  // ============================================
  // CREAR PRECIO DE TEMPORADA
  // ============================================
  static async createSeasonalPrice(propertyId, userId, data) {
    // Verificar que la propiedad existe y pertenece al usuario
    const property = await PropertyModel.findById(propertyId);
    if (!property) {
      throw new Error('Propiedad no encontrada');
    }

    if (property.userId !== userId) {
      throw new Error('No tienes permiso para modificar esta propiedad');
    }

    // Validar fechas
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate >= endDate) {
      throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    if (endDate < new Date()) {
      throw new Error('La fecha de fin no puede ser en el pasado');
    }

    // Validar tipo de precio
    if (!['PERCENTAGE', 'FIXED'].includes(data.priceType)) {
      throw new Error('Tipo de precio inválido. Debe ser PERCENTAGE o FIXED');
    }

    // Validar valor
    if (data.value <= 0) {
      throw new Error('El valor debe ser mayor a 0');
    }

    if (data.priceType === 'PERCENTAGE' && data.value > 500) {
      throw new Error('El porcentaje no puede ser mayor a 500%');
    }

    // Buscar precios solapados (advertencia, no error)
    const overlapping = await SeasonalPriceModel.findOverlapping(
      propertyId,
      startDate,
      endDate
    );

    const seasonalPriceData = {
      propertyId: parseInt(propertyId),
      name: data.name,
      startDate,
      endDate,
      priceType: data.priceType,
      value: parseFloat(data.value),
      priority: data.priority || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    const seasonalPrice = await SeasonalPriceModel.create(seasonalPriceData);

    return {
      seasonalPrice,
      warning: overlapping.length > 0 
        ? `Esta temporada se solapa con ${overlapping.length} temporada(s) existente(s). Se aplicará la de mayor prioridad.`
        : null,
    };
  }

  // ============================================
  // ACTUALIZAR PRECIO DE TEMPORADA
  // ============================================
  static async updateSeasonalPrice(id, userId, data) {
    const seasonalPrice = await SeasonalPriceModel.findById(id);
    if (!seasonalPrice) {
      throw new Error('Precio de temporada no encontrado');
    }

    // Verificar permisos
    if (seasonalPrice.property.userId !== userId) {
      throw new Error('No tienes permiso para modificar este precio de temporada');
    }

    const updateData = {};

    if (data.name) updateData.name = data.name;
    
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
      if (updateData.startDate >= (data.endDate ? new Date(data.endDate) : seasonalPrice.endDate)) {
        throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
      }
    }

    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
      if (updateData.endDate < new Date()) {
        throw new Error('La fecha de fin no puede ser en el pasado');
      }
    }

    if (data.priceType) {
      if (!['PERCENTAGE', 'FIXED'].includes(data.priceType)) {
        throw new Error('Tipo de precio inválido');
      }
      updateData.priceType = data.priceType;
    }

    if (data.value) {
      if (data.value <= 0) {
        throw new Error('El valor debe ser mayor a 0');
      }
      updateData.value = parseFloat(data.value);
    }

    if (data.priority !== undefined) {
      updateData.priority = parseInt(data.priority);
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    // Buscar solapamientos (excluyendo el actual)
    if (updateData.startDate || updateData.endDate) {
      const overlapping = await SeasonalPriceModel.findOverlapping(
        seasonalPrice.propertyId,
        updateData.startDate || seasonalPrice.startDate,
        updateData.endDate || seasonalPrice.endDate,
        id
      );

      if (overlapping.length > 0) {
        updateData.warning = `Se solapa con ${overlapping.length} temporada(s)`;
      }
    }

    return await SeasonalPriceModel.update(id, updateData);
  }

  // ============================================
  // ELIMINAR PRECIO DE TEMPORADA
  // ============================================
  static async deleteSeasonalPrice(id, userId) {
    const seasonalPrice = await SeasonalPriceModel.findById(id);
    if (!seasonalPrice) {
      throw new Error('Precio de temporada no encontrado');
    }

    if (seasonalPrice.property.userId !== userId) {
      throw new Error('No tienes permiso para eliminar este precio de temporada');
    }

    return await SeasonalPriceModel.delete(id);
  }

  // ============================================
  // OBTENER PRECIOS DE UNA PROPIEDAD
  // ============================================
  static async getPropertySeasonalPrices(propertyId, filters = {}) {
    return await SeasonalPriceModel.findByPropertyId(propertyId, filters);
  }

  // ============================================
  // CALCULAR PRECIO PARA UNA FECHA ESPECÍFICA
  // ============================================
  static async calculatePriceForDate(propertyId, date) {
    const property = await PropertyModel.findById(propertyId);
    if (!property) {
      throw new Error('Propiedad no encontrada');
    }

    const basePrice = parseFloat(property.basePrice);
    const targetDate = new Date(date);

    // Obtener precios de temporada activos para esta fecha
    const activeSeasonalPrices = await SeasonalPriceModel.findActiveByDate(
      propertyId,
      targetDate
    );

    // Si no hay precios de temporada, retornar precio base
    if (activeSeasonalPrices.length === 0) {
      return {
        date: targetDate,
        basePrice,
        finalPrice: basePrice,
        appliedSeasons: [],
      };
    }

    // Aplicar el precio de temporada con MAYOR PRIORIDAD
    const topPrioritySeason = activeSeasonalPrices[0];
    let finalPrice = basePrice;

    if (topPrioritySeason.priceType === 'PERCENTAGE') {
      // Aplicar porcentaje
      const percentageValue = parseFloat(topPrioritySeason.value);
      finalPrice = basePrice * (1 + percentageValue / 100);
    } else {
      // Aplicar monto fijo
      finalPrice = basePrice + parseFloat(topPrioritySeason.value);
    }

    // Asegurar que el precio no sea negativo
    finalPrice = Math.max(0, finalPrice);

    return {
      date: targetDate,
      basePrice,
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      appliedSeasons: activeSeasonalPrices.map(season => ({
        id: season.id,
        name: season.name,
        priceType: season.priceType,
        value: season.value,
        priority: season.priority,
        isApplied: season.id === topPrioritySeason.id,
      })),
    };
  }

  // ============================================
  // CALCULAR PRECIOS PARA UN RANGO DE FECHAS
  // ============================================
  static async calculatePriceForDateRange(propertyId, startDate, endDate) {
    const property = await PropertyModel.findById(propertyId);
    if (!property) {
      throw new Error('Propiedad no encontrada');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    const prices = [];
    let totalPrice = 0;

    // Calcular precio para cada día del rango
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayPrice = await this.calculatePriceForDate(propertyId, currentDate);
      prices.push(dayPrice);
      totalPrice += dayPrice.finalPrice;
      
      // Avanzar un día
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const numberOfNights = prices.length;
    const averagePrice = totalPrice / numberOfNights;

    return {
      propertyId: parseInt(propertyId),
      startDate: start,
      endDate: end,
      numberOfNights,
      basePrice: parseFloat(property.basePrice),
      averagePrice: parseFloat(averagePrice.toFixed(2)),
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      dailyPrices: prices,
    };
  }

  // ============================================
  // ACTIVAR/DESACTIVAR TEMPORADA
  // ============================================
  static async toggleSeasonalPrice(id, userId, isActive) {
    const seasonalPrice = await SeasonalPriceModel.findById(id);
    if (!seasonalPrice) {
      throw new Error('Precio de temporada no encontrado');
    }

    if (seasonalPrice.property.userId !== userId) {
      throw new Error('No tienes permiso para modificar este precio de temporada');
    }

    return await SeasonalPriceModel.toggleActive(id, isActive);
  }

  // ============================================
  // OBTENER CALENDARIO DE PRECIOS (30 DÍAS)
  // ============================================
  static async getPriceCalendar(propertyId, startDate = new Date()) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 30); // 30 días adelante

    const calendar = await this.calculatePriceForDateRange(propertyId, start, end);

    // Agrupar por semanas
    const weeks = [];
    let currentWeek = [];

    calendar.dailyPrices.forEach((day, index) => {
      currentWeek.push(day);
      
      if ((index + 1) % 7 === 0 || index === calendar.dailyPrices.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return {
      ...calendar,
      weeks,
    };
  }

  // ============================================
  // VALIDAR CONFLICTOS DE FECHAS
  // ============================================
  static async checkConflicts(propertyId, startDate, endDate, excludeId = null) {
    return await SeasonalPriceModel.findOverlapping(
      propertyId,
      startDate,
      endDate,
      excludeId
    );
  }

  // ============================================
  // LIMPIAR TEMPORADAS EXPIRADAS
  // ============================================
  static async cleanupExpired() {
    return await SeasonalPriceModel.deleteExpired();
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================
  static async getStatistics(propertyId) {
    const stats = await SeasonalPriceModel.getStatsByProperty(propertyId);
    const allSeasons = await SeasonalPriceModel.findByPropertyId(propertyId);

    const now = new Date();
    const activeSeasons = allSeasons.filter(s => s.isActive && s.endDate >= now);
    const expiredSeasons = allSeasons.filter(s => s.endDate < now);

    return {
      total: allSeasons.length,
      active: activeSeasons.length,
      expired: expiredSeasons.length,
      byType: stats,
    };
  }
}

export default SeasonalPriceService;