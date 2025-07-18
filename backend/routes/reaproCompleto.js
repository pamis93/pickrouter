// backend/routes/reaproCompleto.js

import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import checkRol from "../middlewares/checkRol.js";

import {
    pingReaproCompleto,
    subirReaproTotal,
    dividirReaproEntreTrabajadores,
    obtenerReaproAsignado,
    obtenerSeleccionadoReaproCompleto,
    bulkSeleccionReapro,
    exportarReaproFinal,
    combinarReaproCompleto,
    guardarReaproManual,
    obtenerReaproManual,
    exportarReaproManual,
    seleccionarProductoReaproCompleto,
    obtenerSeleccionadosTodos,
    exportarSeleccionGlobal,
} from "../controllers/reaproCompletoController.js";

import getDb from "../db/getDb.js";
import generateError from "../utils/generateError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Multer config...
const storage = multer.diskStorage({
    destination: path.join(__dirname, "../uploads"),
    filename: (req, file, cb) =>
        cb(
            null,
            "reapro_total_" + Date.now() + path.extname(file.originalname)
        ),
});
const upload = multer({ storage });

// ————————— Rutas estándar —————————
router.get("/ping", pingReaproCompleto);

router.post(
    "/subir",
    checkRol(["admin", "supervisor"]),
    upload.single("archivo"),
    subirReaproTotal
);

router.post(
    "/dividir",
    checkRol(["admin", "supervisor"]),
    dividirReaproEntreTrabajadores
);

router.get(
    "/asignado/:nombre",
    checkRol(["operario", "supervisor", "admin"]),
    obtenerReaproAsignado
);

router.get(
    "/seleccionado/:nombre",
    checkRol(["operario", "supervisor", "admin"]),
    obtenerSeleccionadoReaproCompleto
);

router.post(
    "/seleccionar",
    checkRol(["operario", "supervisor", "admin"]),
    seleccionarProductoReaproCompleto
);

router.post(
    "/seleccionar-bulk",
    checkRol(["operario", "supervisor", "admin"]),
    bulkSeleccionReapro
);

// ————— EP endpoints corregidos —————
router.get(
    "/seleccionados-todos",
    checkRol(["admin", "supervisor"]),
    obtenerSeleccionadosTodos
);

router.get(
    "/seleccionados-todos/exportar",
    checkRol(["admin", "supervisor"]),
    exportarSeleccionGlobal
);

// Exportar selecciones personales
router.get(
    "/exportar",
    checkRol(["admin", "supervisor"]),
    exportarReaproFinal
);

// Combinar datos
router.get(
    "/combinar",
    checkRol(["admin", "supervisor"]),
    combinarReaproCompleto
);

// ————— Reapro manual —————
// Primero las rutas de exportación, antes de la dinámica:
router.get(
    "/manual/export",
    exportarReaproManual
);
router.get(
    "/manual/exportar",
    exportarReaproManual
);

// Luego la ruta de guardado y la dinámica de lectura:
router.post(
    "/manual/:nombre",
    guardarReaproManual
);
router.get(
    "/manual/:nombre",
    obtenerReaproManual
);

// ————— Búsqueda por EAN en maestro —————
router.get("/maestro/:ean", (req, res, next) => {
    const db = getDb();
    const { ean } = req.params;
    db.get(
        `SELECT ean, modelo, color, talla, pasillo, modulo FROM maestro WHERE ean = ?`,
        [ean],
        (err, row) => {
            if (err) return next(generateError(err.message, 500));
            if (!row) return next(generateError("EAN no encontrado", 404));
            const ubic =
                row.pasillo && row.modulo
                    ? `P${String(row.pasillo).padStart(2, "0")}-M${String(
                          row.modulo
                      ).padStart(2, "0")}`
                    : "";
            res.json({
                ean: row.ean,
                modelo: row.modelo,
                color: row.color,
                talla: row.talla,
                ubicacion: ubic,
            });
        }
    );
});

export default router;
