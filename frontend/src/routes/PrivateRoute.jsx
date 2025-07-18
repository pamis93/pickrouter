import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const PrivateRoute = ({ allowedRoles }) => {
    const { user, authLoading } = useAuth();

    if (authLoading) return <p className="text-center mt-4">Cargando…</p>;
    if (!user) return <Navigate to="/" replace />;

    const normalizado = user.role === "operario" ? "operario" : user.role;
    if (!allowedRoles.includes(normalizado)) {
        return <Navigate to="/home" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
