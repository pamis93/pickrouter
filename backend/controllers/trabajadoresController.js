import generateError from "../utils/generateError.js";
import getDb from "../db/getDb.js";

export const guardarTrabajadoresYAsignaciones = (req, res, next) => {
  const { trabajadores, asignaciones } = req.body;
  const db = getDb();

  if (!Array.isArray(trabajadores) || !Array.isArray(asignaciones)) {
    return next(generateError("Datos inválidos", 400));
  }

  db.serialize(() => {
    db.run("DELETE FROM trabajadores");
    db.run("DELETE FROM asignaciones");

    const stmtTrabajadores = db.prepare(`INSERT INTO trabajadores (nombre) VALUES (?)`);
    trabajadores.forEach((t) => stmtTrabajadores.run([t]));
    stmtTrabajadores.finalize();

    const stmtAsignaciones = db.prepare(`
      INSERT INTO asignaciones (nombre_trabajador, id_concreto, ean)
      VALUES (?, ?, ?)
    `);
    asignaciones.forEach((a) => {
      stmtAsignaciones.run([a.nombre_trabajador, a.id_concreto, a.ean]);
    });
    stmtAsignaciones.finalize();

    res.json({ message: "Trabajadores y asignaciones guardados correctamente" });
  });
};

export const obtenerTrabajadores = (req, res, next) => {
  const db = getDb();
  db.all("SELECT * FROM trabajadores", [], (err, rows) => {
    if (err) return next(generateError(err.message, 500));
    res.json(rows);
  });
};

export const obtenerProductosTrabajador = (req, res, next) => {
  const { nombre } = req.params;
  const db = getDb();

  const query = `
    SELECT p.*
    FROM productos_combinados p
    JOIN asignaciones a ON a.ean = p.ean
    WHERE a.nombre_trabajador = ?
  `;

  db.all(query, [nombre], (err, rows) => {
    if (err) return next(generateError(err.message, 500));
    res.json(rows);
  });
};
