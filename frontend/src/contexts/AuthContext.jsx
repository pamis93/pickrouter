import React, { createContext, useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
console.log("AuthProvider cargado");

    const login = async (nombre, password) => {
        setAuthLoading(true);
        try {
            const res = await fetch(`${API}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ nombre, password }),
            });
            if (!res.ok) {
                let errMsg = res.statusText;
                try {
                    const errBody = await res.json();
                    errMsg = errBody.message || JSON.stringify(errBody);
                } catch {}
                throw new Error(errMsg);
            }
            const data = await res.json();
            setUser({ name: data.nombre, role: data.rol });
            return true;
        } catch (err) {
            console.error("Login fallido:", err);
            return false;
        } finally {
            setAuthLoading(false);
        }
    };

    const logout = async () => {
        try {
            await fetch(`${API}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch (err) {
            console.error("Error cerrando sesión:", err);
        } finally {
            setUser(null);
        }
    };
console.log("Llamando a /api/auth/check");

    useEffect(() => {
    const checkSession = async () => {
    console.log("🔄 Llamando a /api/auth/check");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const res = await fetch(`${API}/auth/check`, {
            credentials: "include",
            signal: controller.signal,
        });
        console.log("📡 Respuesta status:", res.status);
        if (res.ok) {
            const data = await res.json();
            console.log("✅ Usuario recuperado:", data);
            setUser({ name: data.nombre, role: data.rol });
        } else {
            console.log("❌ Usuario no autenticado");
            setUser(null);
        }
    } catch (err) {
        console.error("Error verificando sesión:", err);
        setUser(null);
    } finally {
        clearTimeout(timeoutId);
        setAuthLoading(false);
    }
};

    checkSession();
}, []);


    return (
        <AuthContext.Provider value={{ user, login, logout, authLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => React.useContext(AuthContext);
