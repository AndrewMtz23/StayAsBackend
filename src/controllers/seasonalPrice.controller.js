// ============================================
// SEASONAL PRICE CONTROLLER
// ============================================
// Este controlador maneja las peticiones HTTP para PRECIOS POR TEMPORADA.
//
// ¿QUÉ HACE?
// Permite a los hosts configurar precios diferentes según la temporada:
// - Temporada alta (Navidad, Semana Santa): +50%
// - Fin de semana: +20%
// - Temporada baja: -30%
// - Eventos especiales: +100%
//
// ENDPOINTS:
// GET    /properties/:propertyId/price                    - Calcular precio para una fecha
// GET    /properties/:propertyId/price-range              - Calcular precio para rango
// GET    /properties/:propertyId/calendar                 - Calendario 30 días
// GET    /properties/:propertyId/seasonal-prices          - Listar temporadas
// POST   /properties/:propertyId/seasonal-prices          - Crear temporada
// PUT    /seasonal-prices/:id                             - Actualizar temporada
// DELETE /seasonal-prices/:id                             - Eliminar temporada
// PATCH  /seasonal-prices/:id/toggle                      - Activar/desactivar
// GET    /properties/:propertyId/seasonal-prices/stats    - Estadísticas
// ============================================

import SeasonalPriceService from "../services/seasonalPrice.service.js";

// ============================================
// CREAR PRECIO DE TEMPORADA
// ============================================
export async function createSeasonalPrice(req, res, next) {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;
    const data = req.body;

    const result = await SeasonalPriceService.createSeasonalPrice(
      propertyId,
      userId,
      data
    );

    res.status(201).json({
      success: true,
      message: "Precio de temporada creado exitosamente",
      data: result.seasonalPrice,
      warning: result.warning,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// OBTENER PRECIOS DE UNA PROPIEDAD
// ============================================
export async function getPropertySeasonalPrices(req, res, next) {
  try {
    const { propertyId } = req.params;
    const filters = {
      isActive: req.query.isActive === "true",
    };

    const prices = await SeasonalPriceService.getPropertySeasonalPrices(
      propertyId,
      filters
    );

    res.json({
      success: true,
      data: prices,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// CALCULAR PRECIO PARA UNA FECHA
// ============================================
export async function calculatePrice(req, res, next) {
  try {
    const { propertyId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "La fecha es requerida (parámetro: date)",
      });
    }

    const result = await SeasonalPriceService.calculatePriceForDate(
      propertyId,
      date
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// CALCULAR PRECIO PARA RANGO DE FECHAS
// ============================================
export async function calculatePriceRange(req, res, next) {
  try {
    const { propertyId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate y endDate son requeridos",
      });
    }

    const result = await SeasonalPriceService.calculatePriceForDateRange(
      propertyId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// OBTENER CALENDARIO DE PRECIOS (30 DÍAS)
// ============================================
export async function getPriceCalendar(req, res, next) {
  try {
    const { propertyId } = req.params;
    const startDate = req.query.startDate || new Date();

    const calendar = await SeasonalPriceService.getPriceCalendar(
      propertyId,
      startDate
    );

    res.json({
      success: true,
      data: calendar,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// ACTUALIZAR PRECIO DE TEMPORADA
// ============================================
export async function updateSeasonalPrice(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const data = req.body;

    const updated = await SeasonalPriceService.updateSeasonalPrice(
      id,
      userId,
      data
    );

    res.json({
      success: true,
      message: "Precio de temporada actualizado exitosamente",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// ELIMINAR PRECIO DE TEMPORADA
// ============================================
export async function deleteSeasonalPrice(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await SeasonalPriceService.deleteSeasonalPrice(id, userId);

    res.json({
      success: true,
      message: "Precio de temporada eliminado exitosamente",
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// ACTIVAR/DESACTIVAR TEMPORADA
// ============================================
export async function toggleSeasonalPrice(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { isActive } = req.body;

    const updated = await SeasonalPriceService.toggleSeasonalPrice(
      id,
      userId,
      isActive
    );

    res.json({
      success: true,
      message: `Precio de temporada ${
        isActive ? "activado" : "desactivado"
      } exitosamente`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// OBTENER ESTADÍSTICAS
// ============================================
export async function getStatistics(req, res, next) {
  try {
    const { propertyId } = req.params;

    const stats = await SeasonalPriceService.getStatistics(propertyId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}