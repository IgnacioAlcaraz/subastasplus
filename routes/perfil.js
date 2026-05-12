const express = require("express");
const ctrl = require("../controllers/perfil.controller");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.get("/", verifyToken, ctrl.obtener);

module.exports = router;
