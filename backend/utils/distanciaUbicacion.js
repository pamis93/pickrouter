/**
 * Convierte una ubicación en formato "3-12-4" a un array de números [3,12,4]
 * @param {string} ubicacion
 * @returns {number[]}
 */
const parseUbicacion = (ubicacion) => {
  if (!ubicacion || typeof ubicacion !== "string") return [];
  return ubicacion
    .trim()
    .split("-")
    .map((parte) => parseInt(parte.trim(), 10));
};

/**
 * Calcula la distancia "aproximada" entre dos ubicaciones.
 * Usa distancia euclidiana para simplicidad.
 * @param {string} u1 - Ubicación actual (ej: "3-12-4")
 * @param {string} u2 - Ubicación de reposición (ej: "5-10-4")
 * @returns {number}
 */
const calcularDistanciaUbicacion = (u1, u2) => {
  if (!u1 || !u2) return Infinity;

  const a = parseUbicacion(u1);
  const b = parseUbicacion(u2);

  if (
    a.length !== 3 ||
    b.length !== 3 ||
    a.some((v) => isNaN(v)) ||
    b.some((v) => isNaN(v))
  ) {
    return Infinity;
  }

  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

export default calcularDistanciaUbicacion;
