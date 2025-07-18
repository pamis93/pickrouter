import express from "express";
import { obtenerDescartes, guardarDescarte } from "../controllers/descartesController.js";
import checkRol from "../middlewares/checkRol.js";

const router = express.Router();

router.get("/", checkRol(["admin", "supervisor"]), obtenerDescartes);
router.post("/", checkRol(["admin", "supervisor", "operario"]), guardarDescarte);

export default router;
