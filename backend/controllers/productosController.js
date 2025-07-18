import generateError from "../utils/generateError.js";
import getDb from "../db/getDb.js";

// ✅ Obtener productos combinados
export const obtenerProductos = (req, res, next) => {
    const db = getDb();

    db.all("SELECT * FROM productos_combinados", [], (err, rows) => {
        db.close(); // ⬅️ cerramos la base de datos
        if (err) return next(generateError(err.message, 500));
        res.json(rows);
    });
};

// ✅ Subir productos combinados
export const subirProductos = (req, res, next) => {
    const productos = req.body;
    const db = getDb();

    db.serialize(() => {
        db.run("DELETE FROM productos_combinados");

        const stmt = db.prepare(`
      INSERT INTO productos_combinados 
      (id_concreto, ean, modelo, color, talla, cantidad, ubicacion)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        for (const p of productos) {
            stmt.run([
                p.id_concreto,
                p.ean,
                p.modelo,
                p.color,
                p.talla,
                p.cantidad,
                p.ubicacion,
            ]);
        }

        stmt.finalize((err) => {
            db.close(); // ⬅️ cerramos cuando finaliza
            if (err) return next(generateError(err.message, 500));
            res.json({
                message: "Productos combinados guardados correctamente",
            });
        });
    });
};

// ✅ Combinar productos desde reapro_total + maestro
export const combinarProductos = (req, res, next) => {
    const db = getDb();
    const modo = req.query.modo;

    if (modo !== "id" && modo !== "ean") {
        return next(generateError("Modo de cruce inválido", 400));
    }

    const campo = modo === "id" ? "id_concreto" : "ean";

    const query = `
    SELECT 
      r.id AS id_reapro,
      r.ean,
      r.modelo,
      r.color,
      r.talla,
      r.cantidad,
      r.id_concreto,
      m.ubicacion
    FROM reapro_total r
    JOIN maestro m ON r.${campo} = m.${campo}
  `;

    db.all(query, [], (err, rows) => {
        if (err) return next(generateError(err.message, 500));
        res.json(rows);
    });
};
