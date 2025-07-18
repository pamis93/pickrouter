import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import QRCode from "react-qr-code";
import { toast } from "react-toastify";

const parseFile = (file) =>
    new Promise((resolve, reject) => {
        const ext = file.name.split(".").pop().toLowerCase();
        const reader = new FileReader();

        // CSV o Excel
        if (ext === "csv" || ext === "xlsx" || ext === "xls") {
            reader.onload = (e) => {
                let rows;
                if (ext === "csv") {
                    const text = e.target.result;
                    const delim = text.includes(";") ? ";" : ",";
                    const lines = text.split(/\r?\n/).filter((l) => l.trim());
                    const headers = lines
                        .shift()
                        .split(delim)
                        .map((h) => h.trim());
                    rows = lines.map((l) => {
                        const cols = l.split(delim);
                        const obj = {};
                        headers.forEach((h, i) => (obj[h] = cols[i]?.trim()));
                        return obj;
                    });
                } else {
                    const wb = XLSX.read(e.target.result, { type: "binary" });
                    rows = XLSX.utils.sheet_to_json(
                        wb.Sheets[wb.SheetNames[0]],
                        {
                            defval: "",
                        }
                    );
                }
                resolve(rows);
            };
            reader.onerror = reject;
            if (ext === "csv") reader.readAsText(file);
            else reader.readAsBinaryString(file);
        } else {
            reject(new Error("Formato no soportado"));
        }
    });

export default function UbicacionesQR() {
    const excelRef = useRef(null);
    const [ubicacionBuscada, setUbicacionBuscada] = useState("");
    const [resultado, setResultado] = useState(null);

    // 1) Importar Excel
    const handleImport = async () => {
        const file = excelRef.current.files?.[0];
        if (!file) return toast.warn("⚠️ Selecciona un archivo XLSX/CSV");
        toast.info("⏳ Leyendo archivo…");
        try {
            const rows = await parseFile(file);
            // Construir FormData
            const form = new FormData();
            form.append("archivo", file);
            toast.info(`✔️ Filas leídas: ${rows.length}`);
            const res = await fetch("/api/ubicacionesqr/subir", {
                method: "POST",
                credentials: "include",
                body: form,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            toast.success(`✅ Importadas ${json.inserted} filas`);
            excelRef.current.value = "";
        } catch (err) {
            console.error(err);
            toast.error("❌ Error importando: " + err.message);
        }
    };

    // 2) Buscar por ubicación
    const handleBuscar = async () => {
        if (!ubicacionBuscada.trim())
            return toast.warn("⚠️ Escribe una ubicación (ej. 5-7-3)");
        try {
            const res = await fetch(
                `/api/ubicacionesqr/buscar-ubicacion/${encodeURIComponent(
                    ubicacionBuscada
                )}`,
                { credentials: "include" }
            );
            if (!res.ok) {
                if (res.status === 404) toast.error("❌ No encontrada");
                else throw new Error(`HTTP ${res.status}`);
                return;
            }
            const json = await res.json();
            setResultado(json);
        } catch (err) {
            console.error(err);
            toast.error("❌ Error buscando: " + err.message);
        }
    };

    return (
        <div className="px-4 py-6 max-w-full sm:max-w-lg mx-auto space-y-8">
            {/* Importar Excel */}
            <div className="bg-white shadow-lg rounded-2xl p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                    Importar ubicaciones
                </h2>
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:gap-4">
                    <input
                        type="file"
                        accept=".csv,.xls,.xlsx"
                        ref={excelRef}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-400 transition"
                    />
                    <button
                        onClick={handleImport}
                        className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition"
                    >
                        Importar Excel
                    </button>
                </div>
            </div>

            {/* Buscar ubicación */}
            <div className="bg-white shadow-lg rounded-2xl p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                    Buscar Código QR
                </h2>
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:gap-4">
                    <input
                        type="text"
                        value={ubicacionBuscada}
                        onChange={(e) => setUbicacionBuscada(e.target.value)}
                        placeholder="Ej. 5-7-3"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-400 transition"
                    />
                    <button
                        onClick={handleBuscar}
                        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        Buscar
                    </button>
                </div>

                {resultado && (
                    <div className="mt-8 text-center">
                        <div className="inline-block bg-gray-50 p-4 rounded-xl shadow-inner">
                            <QRCode value={resultado.codigo} size={160} />
                        </div>
                        <p className="mt-4 text-base sm:text-lg font-semibold text-gray-700">
                            {resultado.codigo}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
