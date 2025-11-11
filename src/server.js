import dotenv from "dotenv";
import app from "./app.js";
import { prisma } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor StayAS corriendo en http://localhost:${PORT}`);
});
