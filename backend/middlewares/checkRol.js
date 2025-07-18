const checkRol = (rolesPermitidos) => {
    return (req, res, next) => {
        const usuario = req.session.user;

        if (!usuario || !rolesPermitidos.includes(usuario.role)) {
            return res
                .status(403)
                .json({ message: "No tienes permisos suficientes" });
        }

        next();
    };
};

export default checkRol;
