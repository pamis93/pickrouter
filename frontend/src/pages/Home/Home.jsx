import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="text-center mt-20">
      <h1 className="text-2xl font-bold mb-4">Bienvenido al sistema de Picking</h1>
      <p className="text-gray-600">
        {user?.role === "admin" || user?.role === "supervisor"
          ? "Puedes cargar artículos, asignar trabajadores y gestionar picking desde el menú superior."
          : "Accede a tus productos asignados o crea reapro desde el menú."}
      </p>
    </div>
  );
};

export default Home;
