// backend/routes/alturaRoutes.js
import express from "express";
import { Router } from "express";
import multer from "multer";
import {
    subirStockAltura,
    procesarReposicionSolo,
} from "../controllers/alturaController.js";

const upload = multer({ dest: "uploads/" });
const router = Router();

// 1) Subida de stock (FormData)
// Ruta original
router.post("/stock-altura", upload.single("stock"), subirStockAltura);

// Ruta alternativa que espera tu frontend
router.post("/stock-altura-json", upload.single("stock"), subirStockAltura);

// 2) Procesar reposición sólo (JSON)
router.post("/reposicion-solo", express.json(), procesarReposicionSolo);

export default router;
