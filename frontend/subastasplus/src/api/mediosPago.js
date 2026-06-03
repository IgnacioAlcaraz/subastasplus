import client from "./client";

export async function getMediosPago() {
  const response = await client.get("/medios-pago");
  return response.data;
}

export async function agregarCuentaNacional({ banco, cbu, cuitCuil, tipoCuenta, titular, alias }) {
  const response = await client.post("/medios-pago/cuenta-nacional", {
    banco,
    cbu,
    cuitCuil,
    tipoCuenta,
    titular,
    alias: alias || undefined,
  });
  return response.data;
}

export async function agregarCuentaExterior({ banco, swift, iban, pais, titular, moneda, alias }) {
  const response = await client.post("/medios-pago/cuenta-exterior", {
    banco,
    swift,
    iban,
    pais,
    titular,
    moneda,
    alias: alias || undefined,
  });
  return response.data;
}

export async function agregarTarjeta({ numero, titular, vencimiento, codigoSeguridad }) {
  const response = await client.post("/medios-pago/tarjeta", {
    numero,
    titular,
    vencimiento,
    codigoSeguridad,
  });
  return response.data;
}

export async function agregarCheque({ banco, numeroCheque, monto, moneda, fechaEmision }) {
  const response = await client.post("/medios-pago/cheque", {
    banco,
    numeroCheque,
    monto,
    moneda,
    fechaEmision,
  });
  return response.data;
}

export async function getMedioPago(id) {
  const response = await client.get(`/medios-pago/${id}`);
  return response.data;
}

export async function eliminarMedioPago(id) {
  await client.delete(`/medios-pago/${id}`);
}
