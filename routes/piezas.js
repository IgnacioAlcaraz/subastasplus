const express = require("express");
const ctrl = require("../controllers/subastas.controller");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/:id", optionalAuth, ctrl.detallePieza);

module.exports = router;
