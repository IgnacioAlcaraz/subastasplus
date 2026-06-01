// guarda la pantalla a la que debe ir el usuario después de autenticarse
// se usa cuando un guest o pending toca algo bloqueado y elige registrarse o iniciar sesión
let pendingRoute = 'Login';

export function setPendingAuthRoute(route) {
  pendingRoute = route;
}

export function consumePendingAuthRoute() {
  const route = pendingRoute;
  // reseteamos a Login después de leerlo para que el próximo exit vaya al default
  pendingRoute = 'Login';
  return route;
}
