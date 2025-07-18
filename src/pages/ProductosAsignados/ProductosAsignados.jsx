import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import Filtros from "../../components/Filtros/Filtros";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL || "/api";

const ProductosAsignados = () => {
    const { nombre } = useParams();
    const { authLoading } = useContext(AuthContext);

    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [seleccionados, setSeleccionados] = useState([]);
    const [, setTotalFiltrado] = useState(0);

    // 1) Cargar los productos asignados a este trabajador
    useEffect(() => {
        if (authLoading) return;
        setLoading(true);
        fetch(`${API}/reapro-completo/asignado/${nombre}`, {
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("Error al cargar asignados");
                return res.json();
            })
            .then((data) => {
                setProductos(data);
                setTotalFiltrado(data.length);
            })
            .catch((err) => {
                console.error("ProductosAsignados error:", err.message);
                setProductos([]);
            })
            .finally(() => setLoading(false));
    }, [nombre, authLoading]);

    // 2) Inicializar la selección desde el backend (lo que ya existiera)
    useEffect(() => {
        if (authLoading) return;
        fetch(`${API}/reapro-completo/seleccionado/${nombre}`, {
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("No se pudo cargar selección");
                return res.json();
            })
            .then((ids) => {
                // ids es un array de id_reapro_total
                setSeleccionados(ids);
            })
            .catch((err) => {
                console.error(
                    "ProductosAsignados cargar selección error:",
                    err.message
                );
                setSeleccionados([]);
            });
    }, [nombre, authLoading]);

    // 3) Toggle local de selección
    const toggleSeleccion = (producto) => {
        const key = producto.id_concreto;
        if (!key) return; // evita claves inválidas
        setSeleccionados((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    // 4) Guardar toda la selección de golpe
    const guardarSeleccion = async () => {
        try {
            const payload = seleccionados.map((key) => ({ id_concreto: key }));
            const res = await fetch(`${API}/reapro-completo/seleccionar-bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ modo: "id", payload }),
            });
            if (!res.ok) throw new Error("Error guardando selección");
            toast.success("✅ Selección guardada correctamente");

            // **Aquí recargamos la lista para que la UI refleje los cambios**
            const res2 = await fetch(
                `${API}/reapro-completo/seleccionado/${nombre}`,
                {
                    credentials: "include",
                }
            );
            if (res2.ok) {
                const data2 = await res2.json();
                setSeleccionados(data2.map((r) => r.id_reapro_total));
            }
        } catch (err) {
            console.error("Error guardando selección:", err);
            toast.error("❌ No se pudo guardar la selección");
        }
    };

    if (authLoading || loading) {
        return <p className="text-center mt-6 text-gray-500">Cargando…</p>;
    }

    return (
        <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">
                Productos asignados a{" "}
                <span className="text-blue-600">{nombre}</span>
            </h2>

            <Filtros
                productos={productos}
                setTotalFiltrado={setTotalFiltrado}
                modoCruce="id"
                seleccionados={seleccionados}
                seleccionadosEan={[]}
                toggleSeleccionado={toggleSeleccion}
            />

            <div className="mt-4 text-right">
                <button
                    onClick={guardarSeleccion}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    💾 Guardar selección
                </button>
            </div>
        </div>
    );
};

export default ProductosAsignados;
