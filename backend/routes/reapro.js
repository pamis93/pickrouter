import express from "express";
import Joi from "joi";
import {
    agregarProductoReapro,
    obtenerReaproPorTrabajador,
    exportarReaproGlobal,
} from "../controllers/reaproController.js";
import validate from "../middlewares/validate.js";
import checkRol from "../middlewares/checkRol.js";

const router = express.Router();

const reaproSchema = Joi.object({
    nombre_trabajador: Joi.string().required(),
    ean: Joi.string().required(),
    modelo: Joi.string().required(),
    color: Joi.string().required(),
    talla: Joi.string().required(),
    cantidad: Joi.number().integer().min(1).default(1),
});

router.post(
    "/",
    checkRol(["operario", "supervisor"]),
    validate(reaproSchema),
    agregarProductoReapro
);
router.get(
    "/trabajador/:nombre",
    checkRol(["operario", "supervisor", "admin"]),
    obtenerReaproPorTrabajador
);
router.get("/global", checkRol(["admin", "supervisor"]), exportarReaproGlobal);

export default router;
