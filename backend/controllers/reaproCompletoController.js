import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import generateError from "../utils/generateError.js";
import getDb from "../db/getDb.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = getDb();

// 🔄 Ping para comprobar que el servidor está vivo
export const pingReaproCompleto = (req, res) => {
    res.json({ message: "pong" });
};

// Normaliza un EAN: string, sin decimales ni espacios
function normalizaEAN(ean) {
    if (ean === undefined || ean === null) return null;
    let s = String(ean).trim();
    if (s.includes(".")) s = s.split(".")[0];
    return s;
}

// Función flexible para extraer cualquier campo (ignora espacios, mayúsculas y puntos)
function getField(obj, ...names) {
    for (const key of Object.keys(obj)) {
        const cleanKey = key.replace(/[\s\.]/g, "").toLowerCase();
        for (const name of names) {
            const cleanName = name.replace(/[\s\.]/g, "").toLowerCase();
            if (cleanKey === cleanName && obj[key] != null && obj[key] !== "") {
                return obj[key];
            }
        }
    }
    return null;
}

export const subirReaproTotal = async (req, res, next) => {
    try {
        if (!req.file)
            return next(generateError("No se subió ningún archivo", 400));
        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const datos = xlsx.utils.sheet_to_json(sheet, { defval: "" });

        const modo = req.query.modo === "id" ? "id" : "ean";

        await new Promise((r, e) =>
            db.run("DELETE FROM reapro_total", (err) => (err ? e(err) : r()))
        );

        let insertados = 0,
            noEncontrados = [];
        for (const prod of datos) {
            const idRaw = getField(prod, "id_concreto", "Id Concreto", "ID");
            const eanRaw = getField(prod, "ean", "EAN", "Ean", "Cód. EAN");
            const id_concreto = idRaw != null ? String(idRaw).trim() : null;
            const ean = normalizaEAN(eanRaw);
            const clave = modo === "id" ? id_concreto : ean;
            if (!clave) {
                noEncontrados.push(clave);
                continue;
            }

            const sql =
                modo === "id"
                    ? "SELECT * FROM maestro WHERE id_concreto = ?"
                    : "SELECT * FROM maestro WHERE ean = ?";
            const prodMaestro = await new Promise((r, e) =>
                db.get(sql, [clave], (err, row) => (err ? e(err) : r(row)))
            );
            if (!prodMaestro) {
                noEncontrados.push(clave);
                continue;
            }

            const cantidad =
                parseInt(prod["Cantidad"] ?? prod["cantidad"] ?? 1, 10) || 1;
            await new Promise((r, e) =>
                db.run(
                    `INSERT INTO reapro_total (ean, modelo, color, talla, cantidad, id_concreto)
           VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        prodMaestro.ean,
                        prodMaestro.modelo,
                        prodMaestro.color,
                        prodMaestro.talla,
                        cantidad,
                        prodMaestro.id_concreto,
                    ],
                    (err) => (err ? e(err) : r())
                )
            );
            insertados++;
        }

        res.json({
            message: `Productos subidos correctamente: ${insertados}. No encontrados: ${noEncontrados.length}`,
            noEncontrados,
        });
    } catch (err) {
        next(generateError("Error procesando el archivo: " + err.message, 500));
    } finally {
        if (req.file?.path && fs.existsSync(req.file.path))
            fs.unlinkSync(req.file.path);
    }
};

// 1️⃣ Selección individual
export const seleccionarProductoReaproCompleto = (req, res, next) => {
    const { modo, payload } = req.body;
    const trabajador = req.session?.user?.nombre || "admin";
    if (!modo || !payload)
        return next(generateError("Faltan datos de selección", 400));

    const clave =
        modo === "id"
            ? normalizaEAN(payload.id_concreto)
            : normalizaEAN(payload.ean);
    if (!clave)
        return next(generateError("Clave inválida para selección", 400));

    const queryBuscar =
        modo === "id"
            ? "SELECT id FROM reapro_total WHERE id_concreto = ?"
            : "SELECT id FROM reapro_total WHERE ean = ?";
    db.get(queryBuscar, [clave], (err, row) => {
        if (err) return next(generateError(err.message, 500));
        if (!row)
            return next(
                generateError("Producto no encontrado en reapro_total", 404)
            );

        db.run(
            `INSERT INTO reapro_selecciones (nombre_trabajador, id_reapro_total)
       VALUES (?, ?)`,
            [
                trabajador,
                row.id_concreto !== undefined ? row.id_concreto : row.id,
            ], // asegurar id_concreto
            function (err) {
                if (err) return next(generateError(err.message, 500));
                res.json({ message: "Producto seleccionado", id: this.lastID });
            }
        );
    });
};

// 2️⃣ Obtener selección de un trabajador
export const obtenerSeleccionadoReaproCompleto = (req, res, next) => {
    const nombre = req.params.nombre;
    res.setHeader("Cache-Control", "no-store");
    const query = `
    SELECT
      rs.id_reapro_total   AS id_reapro_total,
      rt.ean,
      rt.modelo,
      rt.color,
      rt.talla
    FROM reapro_selecciones rs
    JOIN reapro_total rt
      ON rs.id_reapro_total = rt.id_concreto
    WHERE rs.nombre_trabajador = ?
  `;
    db.all(query, [nombre], (err, rows) => {
        if (err) return next(generateError(err.message, 500));
        res.json(rows);
    });
};

// 3️⃣ Listar todas las selecciones (global)
export const obtenerSeleccionadosTodos = (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    const query = `
    SELECT
      rt.id_concreto     AS id_reapro_total,
      rt.ean,
      rt.modelo,
      rt.color,
      rt.talla,
      rt.cantidad,
      s.nombre_trabajador
    FROM reapro_selecciones s
    JOIN reapro_total rt
      ON s.id_reapro_total = rt.id_concreto
    ORDER BY rt.id_concreto, s.nombre_trabajador
  `;
    db.all(query, [], (err, rows) => {
        if (err) return next(generateError(err.message, 500));
        res.json(rows);
    });
};

// 4️⃣ Bulk: guardar en bloque la selección de un trabajador
export const bulkSeleccionReapro = (req, res, next) => {
    try {
        const trabajador = req.session?.user?.nombre;
        const { modo, payload } = req.body;
        if (!trabajador || !Array.isArray(payload)) {
            return next(
                generateError("Faltan datos para guardar selección", 400)
            );
        }

        db.serialize(() => {
            db.run("BEGIN TRANSACTION", (err) => {
                if (err) {
                    console.error("[bulk] BEGIN", err);
                    return next(generateError(err.message, 500));
                }

                db.run(
                    "DELETE FROM reapro_selecciones WHERE nombre_trabajador = ?",
                    [trabajador],
                    (err) => {
                        if (err) {
                            console.error("[bulk] DELETE", err);
                            db.run("ROLLBACK");
                            return next(generateError(err.message, 500));
                        }

                        const stmt = db.prepare(
                            "INSERT INTO reapro_selecciones (nombre_trabajador, id_reapro_total) VALUES (?, ?)"
                        );

                        // Insertar cada elemento
                        for (const item of payload) {
                            stmt.run([trabajador, item.id_concreto], (err) => {
                                if (err) {
                                    console.error("[bulk] INSERT", err);
                                    // No return aquí porque estamos dentro de un bucle,
                                    // pero sí abortamos todo al final
                                }
                            });
                        }

                        stmt.finalize((err) => {
                            if (err) {
                                console.error("[bulk] FINALIZE", err);
                                db.run("ROLLBACK");
                                return next(generateError(err.message, 500));
                            }

                            db.run("COMMIT", (err) => {
                                if (err) {
                                    console.error("[bulk] COMMIT", err);
                                    return next(
                                        generateError(err.message, 500)
                                    );
                                }

                                // Éxito: respondemos y SALIMOS
                                return res.json({
                                    message: "Selección guardada correctamente",
                                    count: payload.length,
                                });
                            });
                        });
                    }
                );
            });
        });
    } catch (err) {
        console.error("[bulkSeleccionReapro] uncaught:", err);
        return next(
            generateError(
                "Error interno al guardar la selección: " + err.message,
                500
            )
        );
    }
};

// ✅ Dividir solo los productos que se han seleccionado entre trabajadores
export const dividirReaproEntreTrabajadores = (req, res, next) => {
    const db = getDb();
    const { trabajadores } = req.body;

    if (!Array.isArray(trabajadores) || trabajadores.length === 0) {
        return next(
            generateError("Debes proporcionar al menos un trabajador", 400)
        );
    }

    const query = `
    SELECT rt.id
    FROM reapro_total rt
    LEFT JOIN maestro m ON rt.id_concreto = m.id_concreto
    ORDER BY
      CAST(m.pasillo AS INTEGER) ASC,
      CAST(m.modulo AS INTEGER) ASC,
      rt.id ASC
  `;

    db.all(query, [], (err, productos) => {
        if (err) return next(generateError(err.message, 500));
        if (productos.length === 0) {
            return next(generateError("No hay productos para dividir", 400));
        }

        db.run("DELETE FROM reapro_selecciones", (errSel) => {
            if (errSel) return next(generateError(errSel.message, 500));

            db.run("DELETE FROM reapro_asignado", (errAsig) => {
                if (errAsig) return next(generateError(errAsig.message, 500));

                const stmt = db.prepare(`
          INSERT INTO reapro_asignado (nombre_trabajador, id_reapro_total)
          VALUES (?, ?)
        `);

                const total = productos.length;
                const porTrabajador = Math.floor(total / trabajadores.length);
                const resto = total % trabajadores.length;
                let startIndex = 0;

                for (let i = 0; i < trabajadores.length; i++) {
                    const count = porTrabajador + (i < resto ? 1 : 0);
                    const slice = productos.slice(
                        startIndex,
                        startIndex + count
                    );
                    for (const prod of slice) {
                        stmt.run([trabajadores[i], prod.id]);
                    }
                    startIndex += count;
                }

                stmt.finalize((errFin) => {
                    if (errFin) return next(generateError(errFin.message, 500));
                    res.json({
                        message:
                            "Productos divididos y asignados correctamente",
                        total,
                        trabajadores: trabajadores.length,
                    });
                });
            });
        });
    });
};

// ✅ Obtener productos ya asignados a un trabajador
export const obtenerReaproAsignado = (req, res, next) => {
    const db = getDb();
    const nombre = req.params.nombre;

    const query = `
    SELECT
      rt.id,
      rt.ean,
      rt.modelo,
      rt.color,
      rt.talla,
      rt.cantidad,
      rt.id_concreto,
      m.pasillo,
      m.modulo,
      m.seccion
    FROM reapro_asignado ra
    JOIN reapro_total rt ON ra.id_reapro_total = rt.id
    LEFT JOIN maestro m ON rt.id_concreto = m.id_concreto
    WHERE ra.nombre_trabajador = ?
  `;

    db.all(query, [nombre], (err, rows) => {
        if (err) return next(generateError(err.message, 500));
        res.json(rows);
    });
};

// ✅ Exportar únicamente los productos seleccionados
export const exportarReaproFinal = (req, res, next) => {
    const { ids } = req.query;
    if (!ids) {
        return next(generateError("No se han proporcionado IDs", 400));
    }

    const idList = ids.split(",").map(Number);
    const placeholders = idList.map(() => "?").join(",");
    const filtro = `rt.id_concreto IN (${placeholders})`;

    const query = `
    SELECT
      rt.id_concreto         AS id_reapro_total,
      rt.ean,
      rt.modelo,
      rt.color,
      rt.talla,
      rt.cantidad,
      m.pasillo,
      m.modulo,
      m.seccion
    FROM reapro_total rt
    LEFT JOIN maestro m
      ON rt.id_concreto = m.id_concreto
    WHERE ${filtro}
    ORDER BY
      CAST(m.pasillo AS INTEGER),
      CAST(m.modulo  AS INTEGER),
      rt.id_concreto
  `;

    res.setHeader("Cache-Control", "no-store");

    db.all(query, idList, (err, rows) => {
        if (err) return next(generateError(err.message, 500));

        const ws = xlsx.utils.json_to_sheet(rows);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "SelecciónFinal");
        const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=reapro_seleccion.xlsx"
        );
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.send(buf);
    });
};

// ✅ Obtener vista completa de la selección (unido con maestro)
export const combinarReaproCompleto = (req, res, next) => {
    const db = getDb();

    const query = `
    SELECT
      rt.id,
      rt.ean,
      rt.modelo,
      rt.color,
      rt.talla,
      rt.cantidad,
      rt.id_concreto,
      m.pasillo,
      m.modulo,
      m.seccion
    FROM reapro_total rt
    LEFT JOIN maestro m ON rt.id_concreto = m.id_concreto
    -- SIN WHERE: así devuelve todos los productos cargados en reapro_total
  `;

    db.all(query, [], (err, rows) => {
        if (err) return next(generateError(err.message, 500));

        const datosConUbicacion = rows.map((r) => ({
            ...r,
            ubicacion:
                r.pasillo && r.modulo
                    ? `P${String(r.pasillo).padStart(2, "0")}-M${String(
                          r.modulo
                      ).padStart(2, "0")}`
                    : "",
        }));
        res.json(datosConUbicacion);
    });
};

// --- Las funciones de reapro manual quedan igual ---
export const guardarReaproManual = (req, res, next) => {
    const db = getDb();
    const usuario = req.params.nombre; // coincide con ruta /manual/:nombre
    const productos = Array.isArray(req.body) ? req.body : [];
    db.serialize(() => {
        db.run("BEGIN TRANSACTION", (err) => {
            if (err) return next(generateError(err.message, 500));
            // Borra anteriores
            db.run(
                "DELETE FROM reapro WHERE usuario = ?",
                [usuario],
                (errDel) => {
                    if (errDel) {
                        db.run("ROLLBACK");
                        return next(generateError(errDel.message, 500));
                    }
                    if (productos.length === 0) {
                        // Lista vacía
                        db.run("COMMIT");
                        return res.json({
                            message: "Lista vaciada correctamente",
                        });
                    }
                    const stmt = db.prepare(`
                    INSERT INTO reapro (ean, modelo, color, talla, ubicacion, usuario)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                    for (const p of productos) {
                        stmt.run(
                            p.ean,
                            p.modelo,
                            p.color,
                            p.talla,
                            p.ubicacion || "",
                            usuario
                        );
                    }
                    stmt.finalize((errIns) => {
                        if (errIns) {
                            db.run("ROLLBACK");
                            return next(generateError(errIns.message, 500));
                        }
                        db.run("COMMIT");
                        res.json({
                            message: "Lista manual guardada correctamente",
                        });
                    });
                }
            );
        });
    });
};

export const obtenerReaproManual = (req, res, next) => {
    const db = getDb();
    const usuario = req.params.nombre;
    db.all(
        `SELECT ean, modelo, color, talla, ubicacion
         FROM reapro
         WHERE usuario = ?`,
        [usuario],
        (err, rows) => {
            if (err) return next(generateError(err.message, 500));
            res.json(rows);
        }
    );
};

export const exportarReaproManual = (req, res, next) => {
    const db = getDb();

    // Forzar que nunca se cachee ni devuelva 304
    res.status(200);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    db.all(
        `SELECT usuario AS nombre_trabajador, ean, modelo, color, talla, ubicacion
         FROM reapro
         ORDER BY usuario ASC, ubicacion ASC`,
        [],
        (err, rows) => {
            if (err) return next(generateError(err.message, 500));
            if (!rows.length)
                return next(
                    generateError("No hay listas manuales para exportar", 404)
                );

            const workbook = xlsx.utils.book_new();
            const porUsuario = rows.reduce((acc, row) => {
                acc[row.nombre_trabajador] = acc[row.nombre_trabajador] || [];
                acc[row.nombre_trabajador].push(row);
                return acc;
            }, {});
            Object.entries(porUsuario).forEach(([usr, lista]) => {
                const ws = xlsx.utils.json_to_sheet(lista);
                xlsx.utils.book_append_sheet(
                    workbook,
                    ws,
                    usr.substring(0, 31)
                );
            });
            const buf = xlsx.write(workbook, {
                type: "buffer",
                bookType: "xlsx",
            });
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=reapro_manual.xlsx"
            );
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.send(buf);
        }
    );
};



// 5️⃣ Nuevo: listar todas las selecciones globales
export const obtenerSeleccionGlobal = (req, res, next) => {
    const db = getDb();
    // Deshabilitar caché
    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    const query = `
    SELECT
      rt.id_concreto     AS id_reapro_total,
      rt.ean,
      rt.modelo,
      rt.color,
      rt.talla,
      rt.cantidad,
      s.nombre_trabajador
    FROM reapro_selecciones s
    JOIN reapro_total rt
      ON s.id_reapro_total = rt.id
    ORDER BY rt.id_concreto, s.nombre_trabajador
  `;
    db.all(query, [], (err, rows) => {
        if (err) return next(generateError(err.message, 500));
        res.json(rows);
    });
};

// 6️⃣ Nuevo: exportar todas las selecciones globales a Excel
export const exportarSeleccionGlobal = (req, res, next) => {
    const db = getDb();
    const query = `
    SELECT
      rt.id_concreto      AS id_reapro_total,
      rt.ean,
      rt.modelo,
      rt.color,
      rt.talla,
      rt.cantidad,
      m.pasillo,
      m.modulo,
      s.nombre_trabajador
    FROM reapro_selecciones s
    JOIN reapro_total rt
      ON s.id_reapro_total = rt.id_concreto
    LEFT JOIN maestro m
      ON rt.id_concreto = m.id_concreto
    ORDER BY rt.id_concreto, s.nombre_trabajador
  `;
    db.all(query, [], (err, rows) => {
        if (err) return next(generateError(err.message, 500));
        const ws = xlsx.utils.json_to_sheet(rows);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "SelecciónGlobal");
        const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=seleccion_global.xlsx"
        );
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.send(buf);
    });
};
