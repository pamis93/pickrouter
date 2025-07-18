import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Acceso no autorizado</h1>
      <p className="text-gray-700 mb-6">
        No tienes permisos para acceder a esta página.
      </p>
      <Link
        to="/home"
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
      >
        Volver al inicio
      </Link>
    </div>
  );
};

export default Unauthorized;
