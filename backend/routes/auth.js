import express from "express";
import Joi from "joi";
import { loginUsuario } from "../controllers/authController.js";
import validate from "../middlewares/validate.js";

const router = express.Router();

const loginSchema = Joi.object({
  nombre: Joi.string().required(),
  password: Joi.string().required()
});

// 🔐 Login
router.post("/login", validate(loginSchema), loginUsuario);

// ✅ Check sesión activa
router.get("/check", (req, res) => {
  if (req.session?.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: "No hay sesión activa" });
  }
});

// 🚪 Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Error al cerrar sesión:", err);
      return res.status(500).json({ message: "Error al cerrar sesión" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada correctamente" });
  });
});

export default router;
