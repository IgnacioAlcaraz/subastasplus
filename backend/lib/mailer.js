const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function enviarCodigoRecuperacion(email, codigo) {
  await transporter.sendMail({
    from: `"SubastasPlus" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Código de recuperación de contraseña",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Recuperá tu contraseña</h2>
        <p>Tu código de verificación es:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a1a1a;margin:24px 0">${codigo}</div>
        <p style="color:#666">Este código expira en 15 minutos.</p>
        <p style="color:#666">Si no solicitaste este código, ignorá este email.</p>
      </div>
    `,
  });
}

async function enviarAprobacionCliente(email, nombre, categoria) {
  await transporter.sendMail({
    from: `"SubastasPlus" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Tu cuenta fue aprobada — SubastasPlus",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>¡Bienvenido/a a SubastasPlus, ${nombre}!</h2>
        <p>Tu solicitud de registro fue <strong>aprobada</strong>.</p>
        <p>Tu categoría asignada es: <strong>${categoria}</strong>.</p>
        <p>Ya podés ingresar a la app y completar tu registro creando tu contraseña.</p>
      </div>
    `,
  });
}

module.exports = { enviarCodigoRecuperacion, enviarAprobacionCliente };
