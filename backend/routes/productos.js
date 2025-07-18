import express from "express";
import {
    obtenerProductos,
    subirProductos,
} from "../controllers/productosController.js";
import checkRol from "../middlewares/checkRol.js";
import { combinarProductos } from "../controllers/productosController.js";

const router = express.Router();

router.get("/productos-combinados", obtenerProductos);
router.post("/", checkRol(["admin", "supervisor"]), subirProductos);
router.get("/combinar", combinarProductos);

export default router;
