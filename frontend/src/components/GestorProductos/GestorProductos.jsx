// src/components/GestorProductos/GestorProductos.jsx
import React, { useState, useRef, useEffect, useContext } from "react";
import Filtros from "../Filtros/Filtros";
import { AuthContext } from "../../contexts/AuthContext";

const API = import.meta.env.VITE_API_URL || "/api";

const GestorProductos = () => {
    const { authLoading, user } = useContext(AuthContext);
    const [productosFinales, setProductosFinales] = useState([]);
    const [totalFiltrado, setTotalFiltrado] = useState(0);
    const [modoCruce, setModoCruce] = useState("id");
    const [reaproLoaded, setReaproLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [seleccionadosInfo, setSeleccionadosInfo] = useState([]);
    const [seleccionados, setSeleccionados] = useState([]);
    const [seleccionadosEan, setSeleccionadosEan] = useState([]);
    const [viewingSeleccionados, setViewingSeleccionados] = useState(false);
    const [isGlobalMode, setIsGlobalMode] = useState(false);

    const reaproRef = useRef(null);

    useEffect(() => {
        console.log("→ FRONTEND usa API =", API);
    }, []);

    // Cuando subimos el Excel
    const handleReaproUpload = async () => {
        const file = reaproRef.current?.files[0];
        if (!file) return;
        const form = new FormData();
        form.append("archivo", file);
        setLoading(true);
        try {
            const res = await fetch(
                `${API}/reapro-completo/subir?modo=${modoCruce}`,
                { method: "POST", body: form, credentials: "include" }
            );
            if (!res.ok)
                throw new Error("No autorizado o error al subir archivo");
            const data = await res.json();
            console.log("✔️ Reapro subido:", data);
            setReaproLoaded(true);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Resetear todo
    const resetearArchivos = () => {
        setReaproLoaded(false);
        setProductosFinales([]);
        setTotalFiltrado(0);
        setSeleccionados([]);
        setSeleccionadosEan([]);
        setViewingSeleccionados(false);
        setIsGlobalMode(false);
        if (reaproRef.current) reaproRef.current.value = "";
    };

    // Combinar datos
    const combinarDatos = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/reapro-completo/combinar`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error(`Error al combinar: ${res.status}`);
            const data = await res.json();
            setProductosFinales(data);
            setTotalFiltrado(data.length);
            setReaproLoaded(true);
            setIsGlobalMode(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Cargar selección global
    const cargarSeleccionGlobal = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${API}/reapro-completo/seleccionados-todos`,
                { credentials: "include", cache: "no-store" }
            );
            if (!res.ok)
                throw new Error("Error al obtener seleccionados globales");
            const lista = await res.json();
            console.log("→ GLOBAL lista:", lista);

            setSeleccionadosInfo(lista);
            const ids = lista.map((r) =>
                modoCruce === "id" ? r.id_reapro_total : r.ean
            );
            if (modoCruce === "id") setSeleccionados(ids);
            else setSeleccionadosEan(ids);

            setProductosFinales(lista);
            setTotalFiltrado(lista.length);
            setViewingSeleccionados(true);
            setIsGlobalMode(true);
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Cargar selección personal
    const cargarSeleccion = async () => {
        setLoading(true);
        setViewingSeleccionados(true);
        try {
            const resSel = await fetch(
                `${API}/reapro-completo/seleccionado/${user.name}`,
                { credentials: "include" }
            );
            if (!resSel.ok) throw new Error("Error al cargar selección");
            const lista = await resSel.json();

            setSeleccionadosInfo(lista);
            const ids = lista.map((r) => r.id_reapro_total);
            if (modoCruce === "id") setSeleccionados(ids);
            else setSeleccionadosEan(ids);

            let productos = productosFinales;
            if (productos.length === 0) {
                const resComb = await fetch(`${API}/reapro-completo/combinar`, {
                    credentials: "include",
                });
                if (!resComb.ok) throw new Error("Error al combinar datos");
                productos = await resComb.json();
            }

            const filtrados = productos.filter((p) => {
                const clave = modoCruce === "id" ? p.id_concreto : p.ean;
                return ids.includes(clave);
            });
            setProductosFinales(filtrados);
            setTotalFiltrado(filtrados.length);
            setIsGlobalMode(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Exportar Excel global
    const exportarExcelGlobal = async () => {
        try {
            const res = await fetch(
                `${API}/reapro-completo/seleccionados-todos/exportar`,
                { credentials: "include" }
            );
            if (!res.ok) throw new Error("Error exportando Excel global");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "seleccion_global.xlsx";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    // Toggle individual
    const toggleSeleccion = async (producto) => {
        const clave = modoCruce === "id" ? producto.id_concreto : producto.ean;
        const isSel =
            modoCruce === "id"
                ? seleccionados.includes(clave)
                : seleccionadosEan.includes(clave);
        const seleccionar = !isSel;
        if (modoCruce === "id") {
            setSeleccionados((prev) =>
                seleccionar ? [...prev, clave] : prev.filter((i) => i !== clave)
            );
        } else {
            setSeleccionadosEan((prev) =>
                seleccionar ? [...prev, clave] : prev.filter((i) => i !== clave)
            );
        }
        try {
            await fetch(`${API}/reapro-completo/seleccionar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    modo: modoCruce,
                    payload: {
                        id_concreto: producto.id_concreto,
                        ean: producto.ean,
                    },
                }),
            });
        } catch (err) {
            console.error("Error guardando selección:", err);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex flex-col gap-4 flex-grow w-full">
                    <label className="block mb-1 font-medium text-gray-700">
                        📦 Subir Excel Reapro:
                    </label>
                    <input
                        ref={reaproRef}
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleReaproUpload}
                        disabled={loading}
                        className="block w-full sm:w-96 border rounded p-2"
                    />
                </div>
                <div className="flex flex-col gap-4 w-full sm:w-[240px]">
                    <button
                        onClick={resetearArchivos}
                        disabled={loading}
                        className="w-full py-2 bg-yellow-500 rounded text-white"
                    >
                        🔄 Actualizar Reapro
                    </button>
                    <button
                        onClick={cargarSeleccionGlobal}
                        disabled={loading}
                        className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        🔁 Cargar selección global
                    </button>
                    <button
                        onClick={cargarSeleccion}
                        disabled={loading}
                        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        🔁 Cargar mi selección
                    </button>
                    <fieldset className="border rounded p-4">
                        <legend className="font-medium mb-2">
                            Modo de cruce:
                        </legend>
                        {["id", "ean"].map((m) => (
                            <label
                                key={m}
                                className="mr-6 cursor-pointer text-sm"
                            >
                                <input
                                    type="radio"
                                    name="modoCruce"
                                    value={m}
                                    checked={modoCruce === m}
                                    onChange={() => setModoCruce(m)}
                                    className="mr-1"
                                />
                                Por {m === "id" ? "Id Concreto" : "EAN"}
                            </label>
                        ))}
                    </fieldset>
                    <button
                        onClick={combinarDatos}
                        disabled={!reaproLoaded || loading}
                        className={`w-full py-2 rounded text-white ${
                            !reaproLoaded || loading
                                ? "bg-gray-400"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {loading ? "Procesando..." : "Combinar Datos"}
                    </button>
                    <button
                        onClick={exportarExcelGlobal}
                        disabled={!seleccionadosInfo.length}
                        className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        📤 Exportar Excel Global
                    </button>
                </div>
            </div>

            {(modoCruce === "id" ? seleccionados : seleccionadosEan).length >
                0 && (
                <details
                    open={viewingSeleccionados}
                    className="mb-4 border rounded"
                >
                    <summary className="px-4 py-2 bg-gray-100 cursor-pointer">
                        📋 Selección Global ({seleccionadosInfo.length})
                    </summary>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="px-2 py-1">EAN</th>
                                <th className="px-2 py-1">Modelo</th>
                                <th className="px-2 py-1">Color</th>
                                <th className="px-2 py-1">Talla</th>
                                <th className="px-2 py-1">Cantidad</th>
                                <th className="px-2 py-1">Pasillo</th>
                                <th className="px-2 py-1">Módulo</th>
                                <th className="px-2 py-1">Trabajador</th>
                            </tr>
                        </thead>
                        <tbody>
                            {seleccionadosInfo.map((r, i) => (
                                <tr
                                    key={`${r.id_reapro_total}-${i}`}
                                    className="border-t"
                                >
                                    <td className="px-2 py-1">{r.ean}</td>
                                    <td className="px-2 py-1">{r.modelo}</td>
                                    <td className="px-2 py-1">{r.color}</td>
                                    <td className="px-2 py-1">{r.talla}</td>
                                    <td className="px-2 py-1">{r.cantidad}</td>
                                    <td className="px-2 py-1">
                                        {r.pasillo ?? ""}
                                    </td>
                                    <td className="px-2 py-1">
                                        {r.modulo ?? ""}
                                    </td>
                                    <td className="px-2 py-1">
                                        {r.nombre_trabajador}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </details>
            )}

            {/* Solo mostramos filtros cuando NO estamos en modo global */}
            {!isGlobalMode && (
                <>
                    <hr className="my-4" />
                    <Filtros
                        productos={productosFinales}
                        setTotalFiltrado={setTotalFiltrado}
                        modoCruce={modoCruce}
                        seleccionados={seleccionados}
                        seleccionadosEan={seleccionadosEan}
                        toggleSeleccionado={toggleSeleccion}
                    />
                </>
            )}
        </div>
    );
};

export default GestorProductos;
