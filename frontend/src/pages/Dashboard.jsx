import React from "react";
import { useAuth } from "../contexts/AuthContext";
import GestorTrabajadores from "../components/GestorTrabajadores/GestorTrabajadores";
import GestorProductos from "../components/GestorProductos/GestorProductos";

const Dashboard = () => {
  const { user } = useAuth();

  const exportarReaproManual = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reapro-completo/manual/exportar`);
      if (!res.ok) throw new Error("Error al exportar");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reapro_manual.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("No se pudo descargar el archivo.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-8 sm:space-y-10">
      
      {/* Sección de descarga manual */}
      {(user?.rol === "admin" || user?.rol === "supervisor") && (
        <section className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mb-3 sm:mb-4">
            📤 Exportar Reapro Manual
          </h2>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">
            Descarga todas las listas manuales escaneadas por los trabajadores.
          </p>
          <button
            onClick={exportarReaproManual}
            className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            Descargar Reapro Manual
          </button>
        </section>
      )}

      {/* Sección trabajadores */}
      <section className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mb-3 sm:mb-4">
          👷 Asignar trabajadores
        </h2>
        <GestorTrabajadores />
      </section>

      {/* Sección productos */}
      <section className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mb-3 sm:mb-4">
          📦 Gestor de Productos
        </h2>
        <GestorProductos />
      </section>
    </div>
  );
};

export default Dashboard;
