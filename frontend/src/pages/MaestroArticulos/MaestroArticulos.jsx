import React, { useRef, useState, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API_URL || "/api";

const ModalSubiendo = ({ bloque, total }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded shadow-lg w-80 flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg font-semibold">
        Subiendo bloque {bloque} de {total}…
      </p>
    </div>
  </div>
);

const MaestroArticulos = () => {
  const { authLoading } = useContext(AuthContext);
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [bloqueActual, setBloqueActual] = useState(0);
  const [totalBloques, setTotalBloques] = useState(0);

  const CHUNK_SIZE = 100;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = fileRef.current.files[0];
    if (!file) return toast.warn("⚠️ Selecciona un archivo Excel primero");

    setLoading(true);
    toast.info("⏳ Leyendo archivo…");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      // 1) Mostrar nombres de hojas
      console.log("Hojas en el Excel:", workbook.SheetNames);

      // 2) Encontrar hojas por patrón flexible
      const hojaProdName = workbook.SheetNames.find((n) =>
        /maestro/i.test(n)
      );
      const hojaUbicName = workbook.SheetNames.find((n) =>
        /ubicac/i.test(n)
      );

      if (!hojaProdName)
        throw new Error("❌ No se encontró ninguna hoja «Maestro» en el Excel");
      if (!hojaUbicName)
        throw new Error("❌ No se encontró ninguna hoja «Ubicación» en el Excel");

      // 3) Convertir a JSON
      const hojaProd = workbook.Sheets[hojaProdName];
      const productos = XLSX.utils.sheet_to_json(hojaProd, { defval: null });
      if (!productos.length)
        throw new Error(
          `❌ La hoja «${hojaProdName}» está vacía`
        );

      const hojaUbic = workbook.Sheets[hojaUbicName];
      const ubicaciones = XLSX.utils.sheet_to_json(hojaUbic, { defval: null });

      // 4) Preparar subida por bloques
      const total = Math.ceil(productos.length / CHUNK_SIZE);
      setTotalBloques(total);
      toast.info(`📦 Subiendo ${productos.length} productos en ${total} bloques…`);

      for (let i = 0; i < productos.length; i += CHUNK_SIZE) {
        const bloque = Math.floor(i / CHUNK_SIZE) + 1;
        setBloqueActual(bloque);

        const chunk = productos.slice(i, i + CHUNK_SIZE);
        console.log(`→ Subiendo bloque ${bloque}/${total}:`, chunk.length, "items");

        // 5) Enviar productos y ubicaciones al backend
        const res = await fetch(`${API}/maestro/subir`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ productos: chunk, ubicaciones }),
        });

        let result;
        try {
          result = await res.json();
        } catch {
          console.error(`❌ Respuesta inválida en bloque ${bloque}`, await res.text());
          throw new Error(`Error en el bloque ${bloque}: respuesta inválida`);
        }

        console.log(`← Resultado bloque ${bloque}:`, result);

        if (!res.ok) {
          console.error(`❌ Error en el bloque ${bloque}:`, result);
          throw new Error(
            `Error en el bloque ${bloque}: ${result.message || "desconocido"}`
          );
        }

        await wait(100);
      }

      toast.success("✅ Todos los productos fueron subidos por bloques.");
      fileRef.current.value = "";
    } catch (err) {
      toast.error(err.message);
      console.error("Error subiendo maestro:", err);
    } finally {
      setLoading(false);
      setBloqueActual(0);
      setTotalBloques(0);
    }
  };

  if (authLoading) return <p>Cargando…</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Subir Maestro Artículos</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">📂 Excel Maestro:</label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx, .xls"
            disabled={loading}
            className="border rounded p-2 w-full sm:w-1/2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Subir Excel
        </button>
      </form>

      {loading && <ModalSubiendo bloque={bloqueActual} total={totalBloques} />}
    </div>
  );
};

export default MaestroArticulos;
