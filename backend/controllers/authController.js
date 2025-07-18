import bcrypt from "bcryptjs";
import getDb from "../db/getDb.js";
import generateError from "../utils/generateError.js";

const db = getDb();

export const loginUsuario = (req, res, next) => {
    const { nombre, password } = req.body;
    if (!nombre || !password) {
        return next(generateError("Nombre y contraseña son obligatorios", 400));
    }

    db.get(
        "SELECT * FROM usuarios WHERE nombre = ?",
        [nombre],
        async (err, user) => {
            if (err) return next(generateError(err.message, 500));
            if (!user) return next(generateError("Usuario no encontrado", 404));

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                return next(generateError("Contraseña incorrecta", 401));
            }

            // ✅ Guarda el usuario en la sesión para futuras peticiones
            req.session.user = {
                nombre: user.nombre,
                role: user.role,
            };

            res.json({
                autenticado: true,
                nombre: user.nombre,
                rol: user.role,
            });
        }
    );
};
