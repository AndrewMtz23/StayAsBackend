import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../config/db.js";

// Prepara y garantiza la carpeta destino para una propiedad existente
export async function preparePropertyUpload(req, res, next) {
  try {
    const propertyId = Number(req.params.id || req.body.propertyId);
    if (!propertyId) {
      return res.status(400).json({ error: "Falta el parámetro propertyId o :id en la ruta" });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, title: true },
    });

    if (!property) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }

    const prefix = property.title.toLowerCase().replace(/\s+/g, "").slice(0, 5);
    const folderName = `accommodation-${property.id}-${prefix}`;
    const basePath = path.join("uploads", "activities", "accommodations");
    const fullPath = path.join(basePath, folderName);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    // Guardar el path para que lo use multer
    req.propertyUploadPath = fullPath;
    req.propertyFolderName = folderName;
    next();
  } catch (err) {
    console.error("Error en preparePropertyUpload:", err);
    return res.status(500).json({ error: "Error preparando la carpeta de subida" });
  }
}

function sanitizeBaseName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 80);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = req.propertyUploadPath || path.join("uploads", "activities", "accommodations", "tmp");
    try {
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    } catch (e) {
      cb(e, uploadPath);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const safe = sanitizeBaseName(base);
    const stamp = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `img-${stamp}-${safe}${ext}`);
  },
});

function imageFileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype);
  if (extname && mimetype) cb(null, true);
  else cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, gif, webp)"));
}

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB por imagen
  fileFilter: imageFileFilter,
});

// Maneja un array de imágenes bajo el campo "images"
export const uploadPropertyMedia = (req, res, next) => {
  const uploadMany = upload.array("images", 20);
  uploadMany(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Error al subir archivo: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};