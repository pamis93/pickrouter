// backend/controllers/alturaController.js
import fs from "fs";
import xlsx from "xlsx";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import getDb from "../db/getDb.js";
import generateError from "../utils/generateError.js";
import calcularDistanciaUbicacion from "../utils/distanciaUbicacion.js";

const db = getDb();
const __dirname = dirname(fileURLToPath(import.meta.url));

function parseValue(v) {
    return v == null ? "" : String(v).trim();
}

// ────────────────────────────────────────────────────────────────
// 1) Subir stock desde archivo
export const subirStockAltura = (req, res, next) => {
    const filePath = req.file?.path;
    if (!filePath)
        return next(generateError("No se ha subido ningún archivo", 400));

    const ext = path.extname(req.file.originalname).toLowerCase();
    let data = [];

    try {
        if (ext === ".csv") {
            const content = fs.readFileSync(filePath, "utf-8");
            const delimiter = content.includes(";") ? ";" : ",";
            const lines = content.split(/\r?\n/).filter((l) => l.trim());
            const headers = lines
                .shift()
                .split(delimiter)
                .map((h) => h.trim());
            data = lines.map((line) => {
                const cols = line.split(delimiter);
                const obj = {};
                headers.forEach((h, i) => (obj[h] = cols[i]?.trim()));
                return obj;
            });
            console.log(
                `[alturaController] CSV parseado: ${data.length} filas`
            );
        } else {
            const wb = xlsx.readFile(filePath);
            data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
                raw: false,
            });
            console.log(
                `[alturaController] XLSX parseado: ${data.length} filas`
            );
        }

        db.serialize(() => {
            db.run("DELETE FROM stock_altura");
            console.log("[alturaController] stock_altura vaciada");

            const stmt = db.prepare(
                "INSERT INTO stock_altura (ean, ubicacion) VALUES (?, ?)"
            );
            let inserted = 0,
                skipped = 0;

            data.forEach((row) => {
                const rawEan = parseValue(row.EAN || row.Ean || row.ean);
                if (!rawEan) {
                    skipped++;
                    return;
                }
                const eanClean = rawEan.split(".")[0];
                const pas = parseValue(row.Pasillo || row.pasillo);
                const mod = parseValue(row.Modulo || row.modulo);
                const alt = parseValue(row.Altura || row.altura);
                const ubic = `${pas}-${mod}-${alt}`;
                stmt.run([eanClean, ubic], (err) => {
                    if (err)
                        console.error(
                            "[alturaController] Error insertando:",
                            err
                        );
                    else inserted++;
                });
            });

            stmt.finalize(() => {
                console.log(
                    `[alturaController] Insertadas ${inserted} filas (saltadas ${skipped})`
                );
                fs.unlink(filePath, () => {});
                res.json({
                    message: "Stock actualizado",
                    totalInserted: inserted,
                });
            });
        });
    } catch (err) {
        next(generateError("Error procesando archivo de stock", 500));
    }
};

// ────────────────────────────────────────────────────────────────
// 2) Procesar reposición contra stock_altura en BD
export const procesarReposicionSolo = (req, res, next) => {
    const seleccion = req.body.seleccion;
    if (!Array.isArray(seleccion))
        return next(generateError("`seleccion` debe ser un array", 400));
    console.log(
        `[alturaController] Selección recibida: ${seleccion.length} filas`
    );

    db.all("SELECT ean, ubicacion FROM stock_altura", [], (err, stockRows) => {
        if (err) return next(generateError(err.message, 500));
        console.log(
            `[alturaController] Stock en BD: ${stockRows.length} filas`
        );

        // 1) Para cada fila de selección, obtener lista de {ubic, dist}
        const conDistLists = seleccion.map((row) => {
            const ean = parseValue(row.EAN || row.ean);
            const pas = parseValue(row.Pasillo || row.pasillo);
            const mod = parseValue(row.Modulo || row.modulo);
            const picking = `${pas}-${mod}-0`;

            const candidatos = stockRows.filter(
                (r) => r.ean === ean && r.ubicacion
            );
            return candidatos
                .map((r) => ({
                    ubic: r.ubicacion,
                    dist: calcularDistanciaUbicacion(picking, r.ubicacion),
                }))
                .filter((c) => c.dist !== Infinity);
        });

        // 2) Construir un mapa ubicación → frecuencia (nº de filas que podrían bajarse juntas)
        const freq = {};
        conDistLists.forEach((list) =>
            list.forEach((c) => {
                freq[c.ubic] = (freq[c.ubic] || 0) + 1;
            })
        );

        // 3) Para cada fila, escoger la ubicación con más freq y, si empatan, la más cercana
        const resultado = seleccion.map((row, i) => {
            const ean = parseValue(row.EAN || row.ean);
            const modelo = parseValue(row.Modelo || row.modelo);
            const color = parseValue(row.Color || row.color);
            const talla = parseValue(row.Talla || row.talla);
            const pas = parseValue(row.Pasillo || row.pasillo);
            const mod = parseValue(row.Modulo || row.modulo);
            const picking = `${pas}-${mod}-0`;

            const conDist = conDistLists[i] || [];
            if (conDist.length === 0) {
                return {
                    ean,
                    modelo,
                    color,
                    talla,
                    ubicacion_reposicion: null,
                    ubicacion_picking: picking,
                };
            }

            conDist.sort((a, b) => {
                const diff = (freq[b.ubic] || 0) - (freq[a.ubic] || 0);
                if (diff !== 0) return diff;
                return a.dist - b.dist;
            });

            const mejor = conDist[0];
            return {
                ean,
                modelo,
                color,
                talla,
                ubicacion_reposicion: mejor.ubic,
                ubicacion_picking: picking,
            };
        });

        console.log(
            `[alturaController] Reposición final: ${resultado.length} filas`
        );
        res.json({ data: resultado });
    });
};
