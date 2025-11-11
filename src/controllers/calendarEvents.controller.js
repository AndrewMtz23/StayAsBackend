import {
  createCalendarEventService,
  getAllCalendarEventsService,
  getCalendarEventByIdService,
  updateCalendarEventService,
  deleteCalendarEventService,
  getCalendarDataService,
} from "../services/calendarEvent.service.js";
import {
  logCalendarEventCreated,
  logCalendarEventUpdated,
  logCalendarEventDeleted,
} from "../services/log.service.js";

/**
 * Crear evento del calendario
 * POST /api/calendar-events
 * Requiere: title, eventDate, categoryIds (array)
 * Opcionales: description, endDate, location, isPublic
 */
export async function createCalendarEvent(req, res) {
  try {
    const userId = req.user?.id;
    const { title, description, eventDate, endDate, categoryIds, location, isPublic } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Usuario no autenticado" 
      });
    }

    const event = await createCalendarEventService({
      userId: Number(userId),
      title,
      description,
      eventDate,
      endDate,
      categoryIds, // ahora es array de IDs
      location,
      isPublic,
    });

    // Log de creación
    await logCalendarEventCreated(req, event);

    return res.status(201).json({
      success: true,
      message: "Evento creado correctamente",
      data: event,
    });
  } catch (err) {
    console.error("Error al crear evento:", err);
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * Listar eventos del calendario
 * GET /api/calendar-events
 * Query params: category, month, year, isPublic, search, startDate, endDate
 */
export async function getCalendarEvents(req, res) {
  try {
    const { category, month, year, isPublic, search, startDate, endDate } = req.query;

    const filters = {};
    
    if (category) filters.category = category;
    if (month) filters.month = parseInt(month);
    if (year) filters.year = parseInt(year);
    if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
    if (search) filters.search = search;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const events = await getAllCalendarEventsService(filters);
    
    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (err) {
    console.error("Error al listar eventos:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error al obtener los eventos" 
    });
  }
}

/**
 * Obtener evento por ID
 * GET /api/calendar-events/:id
 */
export async function getCalendarEventById(req, res) {
  try {
    const { id } = req.params;
    const event = await getCalendarEventByIdService(Number(id));
    
    return res.status(200).json({
      success: true,
      data: event,
    });
  } catch (err) {
    console.error("Error al obtener evento:", err);
    return res.status(404).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * Actualizar evento del calendario
 * PUT /api/calendar-events/:id
 */
export async function updateCalendarEvent(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id;
    const role = req.user?.role;

    const existing = await getCalendarEventByIdService(Number(id));
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: "Evento no encontrado" 
      });
    }

    // Solo el creador, ADMIN o EMPLOYEE pueden editar
    if (role !== "ADMIN" && role !== "EMPLOYEE" && existing.createdBy !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "No tienes permiso para editar este evento" 
      });
    }

    const updated = await updateCalendarEventService(Number(id), data);

    // Log de actualización
    await logCalendarEventUpdated(req, Number(id), updated.title);

    return res.status(200).json({
      success: true,
      message: "Evento actualizado correctamente",
      data: updated,
    });
  } catch (err) {
    console.error("Error al actualizar evento:", err);
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * Eliminar evento del calendario
 * DELETE /api/calendar-events/:id
 */
export async function deleteCalendarEvent(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    const event = await getCalendarEventByIdService(Number(id));
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: "Evento no encontrado" 
      });
    }

    // Solo el creador, ADMIN o EMPLOYEE pueden eliminar
    if (role !== "ADMIN" && role !== "EMPLOYEE" && event.createdBy !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "No tienes permiso para eliminar este evento" 
      });
    }

    // Log de eliminación
    await logCalendarEventDeleted(req, Number(id), event.title);

    await deleteCalendarEventService(Number(id));
    
    return res.status(200).json({
      success: true,
      message: "Evento eliminado correctamente",
    });
  } catch (err) {
    console.error("Error al eliminar evento:", err);
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
}

/**
 * Obtener datos del calendario público (experiencias + eventos personalizados)
 * GET /api/calendar/public?month=10&year=2025
 * Endpoint PÚBLICO (sin autenticación)
 */
export async function getPublicCalendarData(req, res) {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: "Se requieren los parámetros month y year" 
      });
    }

    const data = await getCalendarDataService({
      month: parseInt(month),
      year: parseInt(year),
    });

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error("Error al obtener datos del calendario público:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error al obtener los datos del calendario" 
    });
  }
}