import React, { useEffect, useMemo, useState } from "react";

const Filtros = ({
    productos = [],
    setTotalFiltrado,
    modoCruce,
    seleccionados = [],
    seleccionadosEan = [],
    toggleSeleccionado,
}) => {
    const [pasilloFiltro, setPasilloFiltro] = useState("");
    const [ordenPasillo, setOrdenPasillo] = useState("");
    const [ordenCantidad, setOrdenCantidad] = useState("");
    const [pagina, setPagina] = useState(1);
    const porPagina = 40;

    // Filtrado y ordenación
    const filtradosOrdenados = useMemo(() => {
        let lista = [...productos];

        if (pasilloFiltro.trim()) {
            lista = lista.filter(
                (p) => String(p.pasillo).trim() === pasilloFiltro.trim()
            );
        }

        if (ordenPasillo) {
            lista.sort((a, b) => {
                const pA = parseInt(a.pasillo || 0, 10);
                const pB = parseInt(b.pasillo || 0, 10);
                const mA = parseInt(a.modulo || 0, 10);
                const mB = parseInt(b.modulo || 0, 10);
                if (pA !== pB)
                    return ordenPasillo === "asc" ? pA - pB : pB - pA;
                return ordenPasillo === "asc" ? mA - mB : mB - mA;
            });
        }

        if (ordenCantidad) {
            lista.sort((a, b) =>
                ordenCantidad === "asc"
                    ? (a.cantidad || 0) - (b.cantidad || 0)
                    : (b.cantidad || 0) - (a.cantidad || 0)
            );
        }

        return lista;
    }, [productos, pasilloFiltro, ordenPasillo, ordenCantidad]);

    // Actualizar total y reset página al cambiar lista
    useEffect(() => {
        setTotalFiltrado(filtradosOrdenados.length);
        setPagina(1);
    }, [filtradosOrdenados, setTotalFiltrado]);

    const totalPaginas = Math.ceil(filtradosOrdenados.length / porPagina);
    const desde = (pagina - 1) * porPagina;
    const hasta = pagina * porPagina;
    const paginaProductos = filtradosOrdenados.slice(desde, hasta);

    return (
        <div className="space-y-4">
            {/* Filtros superiores */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-wrap">
                <input
                    type="text"
                    value={pasilloFiltro}
                    onChange={(e) => setPasilloFiltro(e.target.value)}
                    placeholder="Filtrar por pasillo"
                    className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
                />
                <select
                    value={ordenPasillo}
                    onChange={(e) => setOrdenPasillo(e.target.value)}
                    className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
                >
                    <option value="">Orden pasillo/módulo</option>
                    <option value="asc">Ascendente</option>
                    <option value="desc">Descendente</option>
                </select>
                <select
                    value={ordenCantidad}
                    onChange={(e) => setOrdenCantidad(e.target.value)}
                    className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
                >
                    <option value="">Orden cantidad</option>
                    <option value="asc">Menor a mayor</option>
                    <option value="desc">Mayor a menor</option>
                </select>
            </div>

            {/* Tabla de resultados */}
            <div className="overflow-x-auto rounded border">
                <table className="min-w-[700px] w-full border-collapse text-xs sm:text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border px-2 py-1">ID Concreto</th>
                            <th className="border px-2 py-1">EAN</th>
                            <th className="border px-2 py-1">Modelo</th>
                            <th className="border px-2 py-1">Sección</th>
                            <th className="border px-2 py-1">Color</th>
                            <th className="border px-2 py-1">Talla</th>
                            <th className="border px-2 py-1">Cantidad</th>
                            <th className="border px-2 py-1">Pasillo</th>
                            <th className="border px-2 py-1">Módulo</th>
                            <th className="border px-2 py-1">Seleccionar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginaProductos.map((p) => {
                            // ① Calculamos la clave según el modo de cruce
                            const clave =
                                modoCruce === "id" ? p.id_concreto : p.ean;
                            // ② Comprobamos si ya está seleccionado
                            const isSelected =
                                modoCruce === "id"
                                    ? seleccionados.includes(clave)
                                    : seleccionadosEan.includes(clave);

                            return (
                                <tr
                                    key={clave}
                                    className={`cursor-pointer hover:bg-gray-100 ${
                                        isSelected ? "bg-green-100" : ""
                                    }`}
                                >
                                    <td className="border px-2 py-1">
                                        {p.id_concreto}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {p.ean}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {p.modelo}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {p.seccion}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {p.color}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {p.talla}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {p.cantidad}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {p.pasillo}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {p.modulo}
                                    </td>
                                    <td className="border px-2 py-1 text-center">
                                        <button
                                            onClick={() =>
                                                toggleSeleccionado(p)
                                            }
                                            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            {isSelected ? "↺" : "✔"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {Array.from({ length: totalPaginas }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setPagina(i + 1)}
                            className={`px-3 py-1 rounded border text-sm ${
                                pagina === i + 1
                                    ? "bg-blue-600 text-white"
                                    : "bg-white"
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Filtros;
