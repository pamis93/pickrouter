import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import {
    subirExcelUbicaciones,
    buscarUbicacion,
    buscarPorUbicacion,
} from "../controllers/ubicacionesQrController.js";
import checkRol from "../middlewares/checkRol.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// Carpeta de uploads (usa la misma de antes)
const storage = multer.diskStorage({
    destination: path.join(__dirname, "../uploads"),
    filename: (req, file, cb) => {
        cb(null, "ubicaciones_" + Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Importar Excel → sólo admin/supervisor
router.post(
    "/subir",
    checkRol(["admin", "supervisor"]),
    upload.single("archivo"),
    subirExcelUbicaciones
);

// Buscar por código QR → admin, supervisor, operario
router.get(
    "/buscar/:codigo",
    checkRol(["admin", "supervisor", "operario"]),
    buscarUbicacion
);

// Buscar por ubicación → admin, supervisor, operario
router.get(
    "/buscar-ubicacion/:ubicacion",
    checkRol(["admin", "supervisor", "operario"]),
    buscarPorUbicacion
);

export default router;
