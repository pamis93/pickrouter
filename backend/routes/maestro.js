import express from "express";
import { subirMaestro } from "../controllers/maestroController.js";
import checkRol from "../middlewares/checkRol.js";

const router = express.Router();

// ✅ Ya no se usa multer, se recibe JSON
router.post("/subir", checkRol(["admin", "supervisor"]), subirMaestro);

export default router;
