const express = require("express");
const ctrl = require("../controllers/solicitudes-venta.controller");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.use(verifyToken);

router.get("/", ctrl.listar);
router.post("/", ctrl.crear);
router.get("/:id", ctrl.detalle);
router.post("/:id/aceptar-condiciones", ctrl.aceptarCondiciones);
router.get("/:id/poliza", ctrl.verPoliza);
router.get("/:id/contactar-aseguradora", ctrl.contactarAseguradora);

module.exports = router;
