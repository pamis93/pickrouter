import fs from "fs";

/**
 * Procesa el PDF y extrae una lista de { codigo_qr, ubicacion }
 * @param {string} filePath - Ruta al archivo PDF
 * @returns {Promise<Array<{ codigo_qr: string, ubicacion: string }>>}
 */
const extraerUbicacionesDesdePDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);

  // Importación dinámica para evitar errores internos de test
  const pdfParse = (await import("pdf-parse")).default;

  const pdfData = await pdfParse(dataBuffer);
  const texto = pdfData.text;

  const lineas = texto.split("\n").map(linea => linea.trim()).filter(Boolean);

  const resultado = [];

  for (const linea of lineas) {
    const match = linea.match(/(QR\d+)\s*[-→:]?\s*(\d{1,2}-\d{1,2}-\d{1,2})/i);
    if (match) {
      const codigo_qr = match[1].toUpperCase();
      const ubicacion = match[2];
      resultado.push({ codigo_qr, ubicacion });
    }
  }

  return resultado;
};

export default extraerUbicacionesDesdePDF;
