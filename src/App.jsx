import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import PrivateRoute from "./routes/PrivateRoute";
import Login from "./components/Login/Login";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home/Home";
import Dashboard from "./pages/Dashboard";
import ProductosAsignados from "./pages/ProductosAsignados/ProductosAsignados";
import CrearReapro from "./pages/CrearReapro/CrearReapro";
import MaestroArticulos from "./pages/MaestroArticulos/MaestroArticulos";
import Reposicion from "./components/Reposicion/Reposicion";
import UbicacionesQR from "./components/UbicacionesQr/UbicacionesQr";

function App() {
    console.log("App cargada");

    return (
        <>
            <ToastContainer />
            <Routes>
                <Route path="/" element={<Login />} />

                {/* Rutas accesibles por todos los usuarios logueados */}
                <Route
                    element={
                        <PrivateRoute
                            allowedRoles={["admin", "supervisor", "operario"]}
                        />
                    }
                >
                    <Route element={<Layout />}>
                        <Route path="/home" element={<Home />} />
                        <Route
                            path="/productos-asignados/:nombre"
                            element={<ProductosAsignados />}
                        />
                        <Route path="/crear-reapro" element={<CrearReapro />} />

                        <Route path="/reposicion" element={<Reposicion />} />
                        <Route
                            path="/ubicaciones-qr"
                            element={<UbicacionesQR />}
                        />
                    </Route>
                </Route>

                {/* Rutas sólo para admin y supervisor */}
                <Route
                    element={
                        <PrivateRoute allowedRoles={["admin", "supervisor"]} />
                    }
                >
                    <Route element={<Layout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route
                            path="/maestro-articulos"
                            element={<MaestroArticulos />}
                        />
                    </Route>
                </Route>
            </Routes>
        </>
    );
}

export default App;
