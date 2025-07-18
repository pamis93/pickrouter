// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // ✅ Envía cookies de sesión
});

// — Autenticación
export const loginApi = ({ nombre, password }) =>
  api.post('/usuarios/login', { nombre, password });

// — Subida de Excel (reapro)
export const uploadReapro = (file) => {
  const form = new FormData();
  form.append('reapro', file);
  return api.post('/reapro', form); // No pongas headers aquí
};

// ✅ CORREGIDO: Subida de maestro
export const uploadMaestro = (file) => {
  const form = new FormData();
  form.append('maestro', file); // El nombre debe coincidir con upload.single("maestro") en backend
  return api.post('/maestro/subir', form); // SIN headers
};
