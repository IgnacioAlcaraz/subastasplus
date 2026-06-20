let onTokensRefreshed = null;
let onSessionExpired = null;

export function setSessionEventHandlers(handlers) {
  onTokensRefreshed = handlers.onTokensRefreshed ?? null;
  onSessionExpired = handlers.onSessionExpired ?? null;
}

export function notifyTokensRefreshed(token, refreshToken) {
  onTokensRefreshed?.(token, refreshToken);
}

export function notifySessionExpired(reason) {
  onSessionExpired?.(reason);
}
