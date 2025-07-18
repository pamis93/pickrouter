// controllers/reaproController.js
import getDb from "../db/getDb.js";
import generateError from "../utils/generateError.js";
import xlsx from "xlsx";

const db = getDb();

// 1️⃣ Añadir un solo producto al reapro manual (queda igual)
export const agregarProductoReapro = (req, res, next) => {
    const { nombre_trabajador, ean, modelo, color, talla, cantidad } = req.body;
    db.run(
        `
    INSERT INTO reapro
      (nombre_trabajador, ean, modelo, color, talla, cantidad)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
        [nombre_trabajador, ean, modelo, color, talla, cantidad || 1],
        function (err) {
            if (err) return next(generateError(err.message, 500));
            res.json({
                message: "Producto añadido al reapro",
                id: this.lastID,
            });
        }
    );
};

// 2️⃣ Obtener todos los productos de un operario
export const obtenerReaproPorTrabajador = (req, res, next) => {
    const nombre = req.params.nombre;
    db.all(
        `
    SELECT 
      id            AS id_reapro,
      ean,
      modelo,
      color,
      talla,
      cantidad,
      fecha
    FROM reapro
    WHERE nombre_trabajador = ?
    ORDER BY fecha DESC
    `,
        [nombre],
        (err, rows) => {
            if (err) return next(generateError(err.message, 500));
            res.json(rows);
        }
    );
};

// 3️⃣ Guardar en bloque la selección de un operario
export const guardarReaproPorTrabajadorBulk = (req, res, next) => {
    const nombre = req.body.nombre_trabajador || req.session?.user?.nombre;
    const productos = req.body.productos;
    if (!nombre || !Array.isArray(productos)) {
        return next(generateError("Faltan datos para guardar selección", 400));
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        // Borramos la lista previa de este operario
        db.run(`DELETE FROM reapro WHERE nombre_trabajador = ?`, [nombre]);

        const stmt = db.prepare(
            `
      INSERT INTO reapro
        (nombre_trabajador, ean, modelo, color, talla, cantidad)
      VALUES (?, ?, ?, ?, ?, ?)
      `
        );

        for (const p of productos) {
            stmt.run([
                nombre,
                p.ean,
                p.modelo,
                p.color,
                p.talla,
                p.cantidad || 1,
            ]);
        }

        stmt.finalize((err) => {
            if (err) {
                db.run("ROLLBACK");
                return next(generateError(err.message, 500));
            }
            db.run("COMMIT", (err) => {
                if (err) return next(generateError(err.message, 500));
                res.json({
                    message: "Selección guardada correctamente",
                    count: productos.length,
                });
            });
        });
    });
};

// 4️⃣ Obtener la suma global de todos los reapro de todos los operarios
export const exportarReaproGlobal = (req, res, next) => {
    db.all(
        `
    SELECT
      ean,
      modelo,
      color,
      talla,
      SUM(cantidad) AS cantidad
    FROM reapro
    GROUP BY ean, modelo, color, talla
    ORDER BY ean
    `,
        [],
        (err, rows) => {
            if (err) return next(generateError(err.message, 500));

            // Generar Excel
            const worksheet = xlsx.utils.json_to_sheet(rows);
            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, worksheet, "TotalReapro");
            const buffer = xlsx.write(workbook, {
                type: "buffer",
                bookType: "xlsx",
            });

            res.setHeader(
                "Content-Disposition",
                `attachment; filename=reapro_global.xlsx`
            );
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.send(buffer);
        }
    );
};
