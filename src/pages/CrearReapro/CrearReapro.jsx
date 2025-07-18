import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Html5Qrcode } from "html5-qrcode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Cae al path relativo si no está definida la variable de entorno
const API_URL = import.meta.env.VITE_API_URL || "";

const CrearReapro = () => {
    const { user } = useAuth();
    const [eanInput, setEanInput] = useState("");
    const [productosEscaneados, setProductosEscaneados] = useState([]);
    const [descartados, setDescartados] = useState([]);
    const [paginaActual, setPaginaActual] = useState(1);
    const productosPorPagina = 40;
    const [escaneando, setEscaneando] = useState(false);

    useEffect(() => {
        if (!user) return;
        const fetchManual = async () => {
            try {
                const res = await fetch(
                    `${API_URL}/api/reapro-completo/manual/${user.name}`,
                    { credentials: "include" }
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                setProductosEscaneados(data);
            } catch (error) {
                console.error("Error cargando lista manual:", error);
                toast.error("Error cargando lista manual");
            }
        };
        fetchManual();
    }, [user]);

    const handleAddEan = async (ean = eanInput.trim()) => {
        if (!ean) return;
        try {
            const res = await fetch(
                `${API_URL}/api/reapro-completo/maestro/${ean}`
            );
            if (res.status === 404) {
                toast.error("EAN no encontrado");
            } else if (res.ok) {
                const producto = await res.json();
                if (!productosEscaneados.find((p) => p.ean === producto.ean)) {
                    setProductosEscaneados((prev) => [...prev, producto]);
                }
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (err) {
            console.error("Error al buscar EAN:", err);
            toast.error("Error al buscar producto");
        } finally {
            setEanInput("");
        }
    };

    const iniciarEscaneo = async () => {
        try {
            setEscaneando(true);
            const html5QrCode = new Html5Qrcode("scanner");
            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: 250 },
                (decoded) => {
                    handleAddEan(decoded);
                    html5QrCode.stop().then(() => {
                        document.getElementById("scanner").innerHTML = "";
                        setEscaneando(false);
                    });
                },
                () => {}
            );
        } catch (error) {
            console.error(error);
            toast.error("No se pudo acceder a la cámara o escanear");
            setEscaneando(false);
        }
    };

    const toggleDescartado = (ean) => {
        setDescartados((prev) =>
            prev.includes(ean) ? prev.filter((x) => x !== ean) : [...prev, ean]
        );
    };

    const handleFinalizar = async () => {
        if (!user) return;
        const definitivos = productosEscaneados.filter(
            (p) => !descartados.includes(p.ean)
        );
        try {
            const res = await fetch(
                `${API_URL}/api/reapro-completo/manual/${user.name}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(definitivos),
                }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            toast.success("Lista guardada correctamente");
        } catch (error) {
            console.error("Error guardando lista:", error);
            toast.error("Error al guardar la lista");
        }
    };

    const handleExportarExcel = async () => {
        try {
            const res = await fetch(
                `${API_URL}/api/reapro-completo/manual/exportar`,
                { credentials: "include" }
            );
            if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "reapro_manual.xlsx";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error al exportar:", err);
            toast.error("Error al exportar Excel");
        }
    };

    const totalPaginas = Math.ceil(
        productosEscaneados.length / productosPorPagina
    );
    const productosPagina = productosEscaneados.slice(
        (paginaActual - 1) * productosPorPagina,
        paginaActual * productosPorPagina
    );

    return (
        <div className="p-4 space-y-6 max-w-4xl mx-auto">
            <ToastContainer position="top-right" autoClose={3000} />
            <h2 className="text-lg font-semibold text-blue-700">
                📋 Crear Lista de Reapro
            </h2>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <input
                    type="text"
                    value={eanInput}
                    onChange={(e) => setEanInput(e.target.value)}
                    className="border p-2 flex-1"
                    placeholder="Introduce EAN o haz clic en 📷 para escanear"
                />
                <button
                    onClick={() => handleAddEan()}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Añadir
                </button>
                <button
                    onClick={iniciarEscaneo}
                    disabled={escaneando}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                >
                    {escaneando ? "Escaneando…" : "📷"}
                </button>
            </div>

            <div id="scanner" />

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="border px-2">EAN</th>
                            <th className="border px-2">Modelo</th>
                            <th className="border px-2">Color</th>
                            <th className="border px-2">Talla</th>
                            <th className="border px-2">Ubicación</th>
                            <th className="border px-2">Descartar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosPagina.map((prod) => (
                            <tr
                                key={prod.ean}
                                className={
                                    descartados.includes(prod.ean)
                                        ? "bg-red-100"
                                        : ""
                                }
                            >
                                <td className="border p-1">{prod.ean}</td>
                                <td className="border p-1">{prod.modelo}</td>
                                <td className="border p-1">{prod.color}</td>
                                <td className="border p-1">{prod.talla}</td>
                                <td className="border p-1">
                                    {prod.ubicacion || "-"}
                                </td>
                                <td className="border p-1 text-center">
                                    <input
                                        type="checkbox"
                                        checked={descartados.includes(prod.ean)}
                                        onChange={() =>
                                            toggleDescartado(prod.ean)
                                        }
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center">
                <button
                    onClick={() => setPaginaActual((n) => Math.max(n - 1, 1))}
                    disabled={paginaActual === 1}
                    className="px-3 py-1 border rounded"
                >
                    Anterior
                </button>
                <span>
                    Página {paginaActual} de {totalPaginas}
                </span>
                <button
                    onClick={() =>
                        setPaginaActual((n) => Math.min(n + 1, totalPaginas))
                    }
                    disabled={paginaActual === totalPaginas}
                    className="px-3 py-1 border rounded"
                >
                    Siguiente
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                    onClick={handleFinalizar}
                    className="bg-blue-700 text-white px-6 py-2 rounded flex-1"
                >
                    Guardar lista
                </button>

                {(user?.role === "admin" || user?.role === "supervisor") && (
                    <button
                        onClick={handleExportarExcel}
                        className="bg-emerald-600 text-white px-6 py-2 rounded flex-1"
                    >
                        Exportar Excel
                    </button>
                )}
            </div>
        </div>
    );
};

export default CrearReapro;
