import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API = import.meta.env.VITE_API_URL || "/api";

const GestorTrabajadores = ({ onAsignado }) => {
    const [numTrabajadores, setNumTrabajadores] = useState(1);
    const [nombres, setNombres] = useState([""]);

    const cambiarNumTrabajadores = (n) => {
        const num = Math.max(1, Math.min(10, Number(n) || 1));
        setNumTrabajadores(num);
        setNombres((prev) => {
            const nueva = [...prev];
            if (num > nueva.length) {
                for (let i = nueva.length; i < num; i++) nueva.push("");
            } else {
                nueva.length = num;
            }
            return nueva;
        });
    };

    const cambiarNombre = (idx, valor) => {
        setNombres((prev) => {
            const nueva = [...prev];
            nueva[idx] = valor;
            return nueva;
        });
    };

    const guardarAsignacion = async () => {
        const nombresValidos = nombres.map((n) => n.trim()).filter(Boolean);

        if (nombresValidos.length === 0) {
            toast.error("Todos los campos deben estar completos.");
            return;
        }

        if (new Set(nombresValidos).size !== nombresValidos.length) {
            toast.error("Los nombres de los trabajadores deben ser únicos.");
            return;
        }

        try {
            const res = await fetch(`${API}/reapro-completo/dividir`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trabajadores: nombresValidos }),
            });

            if (!res.ok) throw new Error();

            toast.success("✅ Productos asignados correctamente");
            onAsignado?.();
        } catch (err) {
            toast.error("❌ Error al asignar productos. Intenta nuevamente.");
            console.error(err);
        }
    };

    return (
        <div className="p-4 sm:p-6 bg-white rounded shadow w-full space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold">
                Asignar trabajadores
            </h2>

            <label className="block font-medium">
                Número de trabajadores:
                <input
                    type="number"
                    min="1"
                    max="10"
                    value={numTrabajadores}
                    onChange={(e) => cambiarNumTrabajadores(e.target.value)}
                    className="border rounded px-2 py-1 ml-2 w-20 mt-2 sm:mt-0"
                />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {nombres.map((nombre, i) => (
                    <div key={i} className="flex flex-col">
                        <label className="font-medium mb-1 text-sm">
                            Trabajador {i + 1}:
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => cambiarNombre(i, e.target.value)}
                            className="border rounded px-2 py-1"
                            placeholder={`Nombre ${i + 1}`}
                        />
                    </div>
                ))}
            </div>

            <div className="pt-2">
                <button
                    onClick={guardarAsignacion}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
                >
                    Dividir y guardar
                </button>
            </div>
        </div>
    );
};

export default GestorTrabajadores;
