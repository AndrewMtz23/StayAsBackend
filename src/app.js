import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import experiencesRoutes from "./routes/activities.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import logsRoutes from "./routes/logs.routes.js";
import propertiesRoutes from "./routes/properties.routes.js";
import calendarEventsRoutes from "./routes/calendarEvents.routes.js";
import verificationRoutes from "./routes/verification.routes.js";
import hostRequestRoutes from "./routes/hostRequest.routes.js";
import reservationsRoutes from "./routes/reservations.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import adminDashboardRoutes from "./routes/adminDashboard.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import conversationsRoutes from "./routes/conversations.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import favoritesRoutes from "./routes/favorites.routes.js";



const app = express();

// CORS debe permitir tu frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json());
//Carpeta donde se suben las imágenes
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/experiences", experiencesRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/accommodations", propertiesRoutes);
app.use("/api/calendar", calendarEventsRoutes); // Para /api/calendar/public
app.use("/api/calendar-events", calendarEventsRoutes); // Para el CRUD
app.use("/api/verification-codes", verificationRoutes);
app.use("/api/host-requests", hostRequestRoutes); 
app.use("/api/reservations", reservationsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/conversations", conversationsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api", reviewsRoutes);

app.get("/", (req, res) => {
  res.send("StayAS API funcionando correctamente");
});

export default app;