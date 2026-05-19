const tokens = require("../lib/tokens");

function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      code: "AUTH_TOKEN_INVALID",
      message: "Authorization Bearer token requerido",
      details: null,
    });
  }
  try {
    req.user = tokens.verify(token, "access");
    next();
  } catch (err) {
    return res.status(401).json({
      code: "AUTH_TOKEN_INVALID",
      message: "Tu sesión expiró o el token es inválido. Iniciá sesión nuevamente.",
      details: null,
    });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) {
    try {
      req.user = tokens.verify(token, "access");
    } catch (_) {
      req.user = null;
    }
  }
  next();
}

module.exports = { verifyToken, optionalAuth };
