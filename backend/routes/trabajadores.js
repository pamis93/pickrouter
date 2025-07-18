import express from "express";
import {
    guardarTrabajadoresYAsignaciones,
    obtenerTrabajadores,
    obtenerProductosTrabajador,
} from "../controllers/trabajadoresController.js";
import checkRol from "../middlewares/checkRol.js";

const router = express.Router();

router.get("/", obtenerTrabajadores);
router.get("/:nombre", obtenerProductosTrabajador);
router.post(
    "/",
    checkRol(["admin", "supervisor"]),
    guardarTrabajadoresYAsignaciones
);

export default router;
