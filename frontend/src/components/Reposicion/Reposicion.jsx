import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Reposicion = () => {
    const stockRef = useRef(null);
    const seleccionRef = useRef(null);
    const [data, setData] = useState([]);
    const [loadingStock, setLoadingStock] = useState(false);

    // parsea XLSX o CSV a array de objetos
    const parseFile = (file) =>
        new Promise((resolve, reject) => {
            const ext = file.name.split(".").pop().toLowerCase();
            const reader = new FileReader();
            if (ext === "csv") {
                reader.onload = (e) => {
                    const text = e.target.result;
                    const delimiter = text.includes(";") ? ";" : ",";
                    const lines = text.split(/\r?\n/).filter((l) => l.trim());
                    const headers = lines
                        .shift()
                        .split(delimiter)
                        .map((h) => h.trim());
                    const rows = lines.map((line) => {
                        const cols = line.split(delimiter);
                        const obj = {};
                        headers.forEach((h, i) => {
                            obj[h] = cols[i]?.trim();
                        });
                        return obj;
                    });
                    resolve(rows);
                };
                reader.onerror = reject;
                reader.readAsText(file);
            } else {
                reader.onload = (e) => {
                    const wb = XLSX.read(e.target.result, { type: "binary" });
                    const arr = XLSX.utils.sheet_to_json(
                        wb.Sheets[wb.SheetNames[0]],
                        { defval: "" }
                    );
                    resolve(arr);
                };
                reader.onerror = reject;
                reader.readAsBinaryString(file);
            }
        });

    // Subir stock como FormData
    const handleUploadStock = async () => {
        const file = stockRef.current.files?.[0];
        if (!file) {
            toast.warn("⚠️ Selecciona un archivo de stock");
            return;
        }

        setLoadingStock(true);
        toast.info("⏳ Subiendo stock…");

        try {
            const formData = new FormData();
            formData.append("stock", file);

            const res = await fetch("/api/altura/stock-altura-json", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`HTTP ${res.status}: ${txt}`);
            }

            const json = await res.json();
            toast.success(
                `✅ Stock subido: ${json.totalInserted ?? json.total} filas`
            );
            console.log("[Reposicion] Stock subido", json);
        } catch (err) {
            console.error("[Reposicion] Error subiendo stock", err);
            toast.error(`Error al subir stock: ${err.message}`);
        } finally {
            setLoadingStock(false);
            stockRef.current.value = "";
        }
    };

    // Procesar reposición
    const handleProcesar = async () => {
        const file = seleccionRef.current.files?.[0];
        if (!file) {
            toast.warn("⚠️ Selecciona un archivo de productos a reponer");
            return;
        }
        toast.info("⏳ Leyendo selección…");

        try {
            const arr = await parseFile(file);
            toast.info(`✔️ Selección parseada: ${arr.length} filas`);

            const res = await fetch("/api/altura/reposicion-solo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seleccion: arr }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            toast.success(`✅ Reposición calculada: ${json.data.length} filas`);
            setData(json.data);
            console.log("[Reposicion] Resultado", json.data);
        } catch (err) {
            console.error("[Reposicion] Error procesando reposición", err);
            toast.error(`Error procesando reposición: ${err.message}`);
        }
    };

    // Exportar datos de la tabla a Excel
    const handleExport = () => {
        if (data.length === 0) {
            toast.warn("⚠️ No hay datos para exportar");
            return;
        }
        // Creamos hoja de cálculo con json_to_sheet
        const ws = XLSX.utils.json_to_sheet(
            data.map((r) => ({
                EAN: r.ean,
                Modelo: r.modelo,
                Color: r.color,
                Talla: r.talla,
                Reposición: r.ubicacion_reposicion,
                Picking: r.ubicacion_picking?.split("-").slice(0, 2).join("-"),
            }))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reposicion");
        // Disparamos la descarga
        XLSX.writeFile(wb, "reposicion.xlsx");
        toast.success("✅ Exportado a reposicion.xlsx");
    };

    // Calcula frecuencias de ubicaciones de reposición
    const repoCounts = data.reduce((acc, r) => {
        if (r.ubicacion_reposicion) {
            acc[r.ubicacion_reposicion] =
                (acc[r.ubicacion_reposicion] || 0) + 1;
        }
        return acc;
    }, {});

    return (
        <>
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Subida de stock */}
                <div className="space-y-2">
                    <label className="block font-medium">
                        Stock altura (CSV/XLSX)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="file"
                            accept=".csv,.xls,.xlsx"
                            ref={stockRef}
                            className="flex-1 border rounded p-2"
                            disabled={loadingStock}
                        />
                        <button
                            onClick={handleUploadStock}
                            disabled={loadingStock}
                            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                        >
                            Subir Stock
                        </button>
                    </div>
                </div>

                {/* Procesar reposición */}
                <div className="space-y-2">
                    <label className="block font-medium">
                        Productos a reponer (Excel)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="file"
                            accept=".xls,.xlsx"
                            ref={seleccionRef}
                            className="flex-1 border rounded p-2"
                        />
                        <button
                            onClick={handleProcesar}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Procesar Reposición
                        </button>
                    </div>
                </div>

                {/* Resultados y exportación */}
                {data.length > 0 && (
                    <div className="space-y-4">
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Exportar a Excel
                        </button>
                        <div className="overflow-auto">
                            <table className="min-w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-200">
                                        {[
                                            "EAN",
                                            "Modelo",
                                            "Color",
                                            "Talla",
                                            "Repo",
                                            "Picking",
                                        ].map((h) => (
                                            <th
                                                key={h}
                                                className="border px-2 py-1 text-left font-medium"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((r, i) => {
                                        const count =
                                            repoCounts[
                                                r.ubicacion_reposicion
                                            ] || 0;
                                        const highlight = count > 1;
                                        return (
                                            <tr
                                                key={i}
                                                className={
                                                    i % 2 ? "bg-gray-50" : ""
                                                }
                                            >
                                                <td className="border px-2 py-1">
                                                    {r.ean}
                                                </td>
                                                <td className="border px-2 py-1">
                                                    {r.modelo}
                                                </td>
                                                <td className="border px-2 py-1">
                                                    {r.color}
                                                </td>
                                                <td className="border px-2 py-1">
                                                    {r.talla}
                                                </td>
                                                <td
                                                    className={`border px-2 py-1 ${
                                                        highlight
                                                            ? "bg-yellow-200"
                                                            : ""
                                                    }`}
                                                >
                                                    {r.ubicacion_reposicion}
                                                </td>
                                                <td className="border px-2 py-1">
                                                    {r.ubicacion_picking
                                                        ?.split("-")
                                                        .slice(0, 2)
                                                        .join("-")}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
                draggable
            />
        </>
    );
};

export default Reposicion;
