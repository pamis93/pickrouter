import express from "express";

import productosRoutes from "./productos.js";
import maestroRoutes from "./maestro.js";
import trabajadoresRoutes from "./trabajadores.js";
import descartesRoutes from "./descartes.js";
import ubicacionesQrRoutes from "./ubicacionesQr.js";
import reaproRoutes from "./reapro.js";
import alturaRoutes from "./alturaRoutes.js";
import authRoutes from "./auth.js";
import reaproCompletoRoutes from "./reaproCompleto.js";

const router = express.Router();

// Rutas de autenticación
router.use("/auth", authRoutes);

// Rutas principales
router.use("/productos", productosRoutes);
router.use("/maestro", maestroRoutes);
router.use("/trabajadores", trabajadoresRoutes);
router.use("/descartes", descartesRoutes);
router.use("/ubicacionesqr", ubicacionesQrRoutes);

// Rutas de reapro completo (incluye también las de reapro manual)
router.use("/reapro-completo", reaproCompletoRoutes);

// Rutas de reapro “simple”
router.use("/reapro", reaproRoutes);

// Rutas de altura
router.use("/altura", alturaRoutes);

export default router;
