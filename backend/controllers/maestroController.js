import generateError from "../utils/generateError.js";
import getDb from "../db/getDb.js";

function normalizaEAN(ean) {
    if (ean === undefined || ean === null) return null;
    let s = String(ean).trim();
    if (s.includes(".")) s = s.split(".")[0];
    return s;
}

function getField(obj, ...names) {
    for (const key of Object.keys(obj)) {
        const cleanKey = key.replace(/[\s\.]/g, "").toLowerCase();
        for (const name of names) {
            if (
                cleanKey === name.replace(/[\s\.]/g, "").toLowerCase() &&
                obj[key] != null &&
                obj[key] !== ""
            ) {
                return obj[key];
            }
        }
    }
    return null;
}

let yaBorrado = false; // 🔒 se mantiene entre llamadas mientras vive el proceso

export const subirMaestro = (req, res, next) => {
    const productos = req.body.productos;
    const ubicaciones = Array.isArray(req.body.ubicaciones)
        ? req.body.ubicaciones
        : [];

    if (!Array.isArray(productos) || productos.length === 0) {
        return next(generateError("No se enviaron productos válidos", 400));
    }

    console.log("[maestroController] Productos recibidos:", productos.length);
    console.log(
        "[maestroController] Ubicaciones recibidas:",
        ubicaciones.length
    );

    const mapaUbic = new Map();
    for (const u of ubicaciones) {
        const rawEanU = getField(u, "ean", "EAN", "Cód. EAN", "Ean");
        const eanU = normalizaEAN(rawEanU);
        const idRawU = getField(u, "id_concreto", "Id Concreto", "ID Concreto", "ID");
        const idConcretoU = idRawU != null ? String(idRawU).trim() : null;
        const claveU = eanU || idConcretoU;
        if (claveU) {
            mapaUbic.set(claveU, u);
        }
    }

    const db = getDb();
    try {
        db.serialize(() => {
            const continuarInsercion = () => {
                const stmt = db.prepare(
                    `INSERT OR REPLACE INTO maestro
                    (id_concreto, ean, modelo, color, talla, pasillo, modulo, seccion)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                );

                let insertados = 0;
                for (const p of productos) {
                    const rawEan = getField(p, "ean", "EAN", "Cód. EAN", "Ean");
                    const ean = normalizaEAN(rawEan);
                    const idRaw = getField(p, "id_concreto", "Id Concreto", "ID Concreto", "ID");
                    const idConcreto = idRaw != null ? String(idRaw).trim() : null;
                    const clave = ean || idConcreto;
                    if (!clave) {
                        console.warn("Producto ignorado por falta de clave:", p);
                        continue;
                    }

                    const modelo = getField(p, "modelo", "Modelo");
                    const color = getField(p, "color", "Color");
                    const talla = getField(p, "talla", "Talla");

                    const loc = mapaUbic.get(clave) || {};
                    const pasillo = String(getField(loc, "pasillo", "Pasillo", "Pas", "pas") || "").trim();
                    const modulo = String(getField(loc, "modulo", "Modulo", "Mod", "mod") || "").trim();
                    const seccion = String(getField(loc, "seccion", "Seccion") || "").trim();

                    console.log(`→ Ubicación [${clave}]: pasillo='${pasillo}', modulo='${modulo}', seccion='${seccion}'`);

                    stmt.run(
                        [idConcreto, ean, modelo, color, talla, pasillo, modulo, seccion],
                        function (err) {
                            if (err) {
                                console.error("Error insertando:", p, err.message);
                            } else {
                                insertados++;
                            }
                        }
                    );
                }

                stmt.finalize(() => {
                    res.json({
                        message: "Maestro actualizado correctamente",
                        insertados,
                        ignorados: productos.length - insertados,
                    });
                });
            };

            if (!yaBorrado) {
                db.run("DELETE FROM maestro", (err) => {
                    if (err)
                        return next(generateError("Error al borrar maestro: " + err.message, 500));
                    db.run("DELETE FROM sqlite_sequence WHERE name='maestro'", (err) => {
                        if (err)
                            return next(generateError("Error al reiniciar ID: " + err.message, 500));

                        yaBorrado = true;
                        continuarInsercion();
                    });
                });
            } else {
                continuarInsercion();
            }
        });
    } catch (err) {
        console.error("Error general maestro:", err.message);
        return next(generateError("Error general: " + err.message, 500));
    }
};
