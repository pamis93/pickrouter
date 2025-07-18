import getDb from "../db/getDb.js";
import generateError from "../utils/generateError.js";

const db = getDb();

// ✅ Guardar producto descartado
export const guardarDescarte = (req, res, next) => {
  const { ean, id_concreto } = req.body;

  db.run(
    `INSERT INTO productos_descartados (ean, id_concreto) VALUES (?, ?)`,
    [ean, id_concreto],
    function (err) {
      if (err) return next(generateError(err.message, 500));
      res.json({ message: "Producto descartado correctamente" });
    }
  );
};

// ✅ Obtener lista de productos descartados
export const obtenerDescartes = (req, res, next) => {
  db.all("SELECT * FROM productos_descartados", [], (err, rows) => {
    if (err) return next(generateError(err.message, 500));
    res.json(rows);
  });
};
