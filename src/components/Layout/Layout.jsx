import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch {
            /* ignore */
        } finally {
            logout();
            navigate("/");
        }
    };

    const toggleMenu = () => setMenuOpen((o) => !o);

    const linkClasses = ({ isActive }) =>
        `block px-3 py-2 rounded-md transition-colors ${
            isActive
                ? "bg-white/30 text-white font-semibold"
                : "text-white hover:bg-white/20"
        }`;

    return (
        <div className="flex flex-col min-h-screen">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                <div className="container mx-auto flex items-center justify-between px-4 py-3">
                    <h1 className="text-xl font-bold tracking-tight">
                        PickRoute
                    </h1>

                    {/* hamburguesa hasta md */}
                    <button
                        className="md:hidden p-2"
                        onClick={toggleMenu}
                        aria-label="Abrir menú"
                    >
                        {menuOpen ? (
                            <span className="text-2xl">&times;</span>
                        ) : (
                            <span className="text-2xl">&#9776;</span>
                        )}
                    </button>

                    {/* menú escritorio desde md */}
                    <nav className="hidden md:flex space-x-2">
                        <NavLink to="/home" className={linkClasses}>
                            Inicio
                        </NavLink>
                        {user?.role !== "operario" && (
                            <>
                                <NavLink
                                    to="/dashboard"
                                    className={linkClasses}
                                >
                                    Combinar Datos
                                </NavLink>
                                <NavLink
                                    to="/maestro-articulos"
                                    className={linkClasses}
                                >
                                    Actualizar Maestro
                                </NavLink>
                                <NavLink
                                    to="/reposicion"
                                    className={linkClasses}
                                >
                                    Reposición
                                </NavLink>
                            </>
                        )}
                        <NavLink to="/ubicaciones-qr" className={linkClasses}>
                            Ubicaciones QR
                        </NavLink>
                        <NavLink
                            to={`/productos-asignados/${user?.name}`}
                            className={linkClasses}
                        >
                            Mis Productos
                        </NavLink>
                        <NavLink to="/crear-reapro" className={linkClasses}>
                            Crear Reapro
                        </NavLink>
                        <button
                            onClick={handleLogout}
                            className="ml-4 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition"
                        >
                            Cerrar sesión
                        </button>
                    </nav>
                </div>

                {/* drawer móvil */}
                {menuOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black bg-opacity-30"
                        onClick={toggleMenu}
                    >
                        <div
                            className="absolute top-0 left-0 bottom-0 w-64 bg-white p-6 space-y-4 shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <NavLink
                                to="/home"
                                onClick={toggleMenu}
                                className="block px-3 py-2 rounded hover:bg-gray-100"
                            >
                                Inicio
                            </NavLink>
                            {user?.role !== "operario" && (
                                <>
                                    <NavLink
                                        to="/dashboard"
                                        onClick={toggleMenu}
                                        className="block px-3 py-2 rounded hover:bg-gray-100"
                                    >
                                        Combinar Datos
                                    </NavLink>
                                    <NavLink
                                        to="/maestro-articulos"
                                        onClick={toggleMenu}
                                        className="block px-3 py-2 rounded hover:bg-gray-100"
                                    >
                                        Actualizar Maestro
                                    </NavLink>
                                    <NavLink
                                        to="/reposicion"
                                        onClick={toggleMenu}
                                        className="block px-3 py-2 rounded hover:bg-gray-100"
                                    >
                                        Reposición
                                    </NavLink>
                                </>
                            )}
                            <NavLink
                                to="/ubicaciones-qr"
                                onClick={toggleMenu}
                                className="block px-3 py-2 rounded hover:bg-gray-100"
                            >
                                Ubicaciones QR
                            </NavLink>
                            <NavLink
                                to={`/productos-asignados/${user?.name}`}
                                onClick={toggleMenu}
                                className="block px-3 py-2 rounded hover:bg-gray-100"
                            >
                                Mis Productos
                            </NavLink>
                            <NavLink
                                to="/crear-reapro"
                                onClick={toggleMenu}
                                className="block px-3 py-2 rounded hover:bg-gray-100"
                            >
                                Crear Reapro
                            </NavLink>
                            <button
                                onClick={() => {
                                    handleLogout();
                                    toggleMenu();
                                }}
                                className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-100 rounded"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-grow bg-gray-50 p-4 md:p-6">
                <div className="container mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
