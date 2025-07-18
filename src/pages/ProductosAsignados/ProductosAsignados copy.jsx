import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import Filtros from "../../components/Filtros/Filtros";

const API = import.meta.env.VITE_API_URL || "/api";

const ProductosAsignados = () => {
  const { nombre } = useParams();
  const { authLoading } = useContext(AuthContext);

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [descartados, setDescartados] = useState([]);
  const [totalFiltrado, setTotalFiltrado] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    setLoading(true);
    fetch(`${API}/reapro-completo/asignado/${nombre}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar productos asignados");
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

  const toggleDesc = async (p) => {
    setLoading(true);
    try {
      const payload = {
        modo: "id",
        payload: { id_concreto: p.id_concreto },
      };
      const res = await fetch(`${API}/reapro-completo/descartar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al descartar");

      setDescartados((prev) =>
        prev.includes(p.id_concreto)
          ? prev.filter((x) => x !== p.id_concreto)
          : [...prev, p.id_concreto]
      );
    } catch (err) {
      console.error("Error descartando producto:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return <p className="text-center mt-4">Cargando…</p>;

  return (
    <div className="px-6 py-4">
      <h2 className="text-2xl font-semibold mb-4">
        Productos asignados a{" "}
        <span className="text-blue-600">{nombre}</span>
      </h2>

      <Filtros
        productos={productos}
        setTotalFiltrado={setTotalFiltrado}
        modoCruce="id"
        descartados={descartados}
        descartadosEan={[]}
        toggleDescartado={toggleDesc}
      />
    </div>
  );
};

export default ProductosAsignados;
