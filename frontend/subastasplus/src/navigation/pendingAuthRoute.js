let pendingRoute = 'Login';

export function setPendingAuthRoute(route) {
  pendingRoute = route;
}

export function consumePendingAuthRoute() {
  const route = pendingRoute;
  pendingRoute = 'Login';
  return route;
}
