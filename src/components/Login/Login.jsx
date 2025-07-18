// src/components/Login/Login.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const Login = () => {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user, authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Si ya estamos logueados, vamos a /home
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/home');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!nombre.trim() || !password.trim()) {
      setError('Introduce nombre y contraseña');
      return;
    }

    const success = await login(nombre, password);
    if (!success) {
      setError('Credenciales inválidas');
    }
    // Si success === true, el useEffect redirigirá a /home
  };

  if (authLoading) {
    return <p className="p-6 text-center">Cargando…</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white shadow-md rounded px-8 py-6"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">Iniciar Sesión</h2>

        {error && (
          <p className="mb-4 text-red-600 text-center">
            {error}
          </p>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="nombre">
            Nombre
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Entrar
        </button>
      </form>
    </div>
  );
};

export default Login;
