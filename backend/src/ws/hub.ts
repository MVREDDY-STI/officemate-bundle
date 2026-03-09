/** WebSocket connection hub — manages all live clients and broadcasts events */

// ── User clients (JWT auth) ───────────────────────────────────

type WsClient = {
  ws: WebSocket;
  userId: string;
};

const clients = new Set<WsClient>();

export function addClient(ws: WebSocket, userId: string): WsClient {
  const client: WsClient = { ws, userId };
  clients.add(client);
  return client;
}

export function removeClient(client: WsClient): void {
  clients.delete(client);
}

export function broadcast(event: string, data: unknown, excludeUserId?: string): void {
  const message = JSON.stringify({ event, data });
  for (const client of clients) {
    if (excludeUserId && client.userId === excludeUserId) continue;
    try {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    } catch {
      clients.delete(client);
    }
  }
}

export function broadcastToUser(userId: string, event: string, data: unknown): void {
  const message = JSON.stringify({ event, data });
  for (const client of clients) {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(message);
      } catch {
        clients.delete(client);
      }
    }
  }
}

export function clientCount(): number {
  return clients.size;
}

// ── Device clients (device_token auth) ───────────────────────

type DeviceClient = {
  ws: WebSocket;
  displayId: string; // UUID of tv_displays record
};

const deviceClients = new Set<DeviceClient>();

export function addDeviceClient(ws: WebSocket, displayId: string): DeviceClient {
  const client: DeviceClient = { ws, displayId };
  deviceClients.add(client);
  return client;
}

export function removeDeviceClient(client: DeviceClient): void {
  deviceClients.delete(client);
}

export function broadcastToDevice(displayId: string, event: string, data: unknown): void {
  const message = JSON.stringify({ event, data });
  for (const client of deviceClients) {
    if (client.displayId === displayId && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(message);
      } catch {
        deviceClients.delete(client);
      }
    }
  }
}

export function broadcastToAllDevices(event: string, data: unknown): void {
  const message = JSON.stringify({ event, data });
  for (const client of deviceClients) {
    try {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    } catch {
      deviceClients.delete(client);
    }
  }
}

export function broadcastToDevices(displayIds: string[], event: string, data: unknown): void {
  const ids = new Set(displayIds);
  const message = JSON.stringify({ event, data });
  for (const client of deviceClients) {
    if (ids.has(client.displayId) && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(message);
      } catch {
        deviceClients.delete(client);
      }
    }
  }
}

export function getOnlineDisplayIds(): string[] {
  return [...deviceClients].map(c => c.displayId);
}

export function deviceClientCount(): number {
  return deviceClients.size;
}
