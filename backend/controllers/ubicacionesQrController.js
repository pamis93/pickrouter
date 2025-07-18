import getDb from "../db/getDb.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import generateError from "../utils/generateError.js";
import XLSX from "xlsx";

const db = getDb();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📥 Importar Excel con columnas: "ID Altura", "Pasillo", "Modulo", "Altura"
export const subirExcelUbicaciones = async (req, res, next) => {
    if (!req.file)
        return next(generateError("No se subió ningún archivo", 400));

    try {
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (![".xlsx", ".xls", ".csv"].includes(ext)) {
            return next(
                generateError("Formato no soportado, usa XLSX/XLS/CSV", 400)
            );
        }

        // Leer el archivo
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            defval: "",
        });

        // Volcar a la tabla ubicaciones_qr
        const insertStmt = `INSERT OR REPLACE INTO ubicaciones_qr(codigo_qr, ubicacion) VALUES(?,?)`;
        const stmt = db.prepare(insertStmt);

        rows.forEach((row) => {
            const codigo = String(row["ID Altura"]).trim();
            const pasillo = String(row["Pasillo"]).trim();
            const modulo = String(row["Modulo"]).trim();
            const altura = String(row["Altura"]).trim();
            if (codigo && pasillo && modulo && altura) {
                const ubicacion = `${pasillo}-${modulo}-${altura}`;
                stmt.run(codigo, ubicacion);
            }
        });

        stmt.finalize();

        // Borrar el archivo subido
        fs.unlink(req.file.path, () => {});
        res.json({ inserted: rows.length });
    } catch (err) {
        next(generateError(err.message, 500));
    }
};

// 🔍 Buscar por código QR (mantengo la ruta original)
export const buscarUbicacion = (req, res, next) => {
    const { codigo } = req.params;
    const query = `SELECT ubicacion FROM ubicaciones_qr WHERE codigo_qr = ?`;
    db.get(query, [codigo.toUpperCase()], (err, row) => {
        if (err) return next(generateError(err.message, 500));
        if (!row) return next(generateError("Código QR no encontrado", 404));
        res.json({ codigo, ubicacion: row.ubicacion });
    });
};

// 🔍 Buscar por ubicación (p.ej. "5-7-3") → devuelve el código QR
export const buscarPorUbicacion = (req, res, next) => {
    const { ubicacion } = req.params;
    const query = `SELECT codigo_qr FROM ubicaciones_qr WHERE ubicacion = ?`;
    db.get(query, [ubicacion], (err, row) => {
        if (err) return next(generateError(err.message, 500));
        if (!row) return next(generateError("Ubicación no encontrada", 404));
        res.json({ ubicacion, codigo: row.codigo_qr });
    });
};
