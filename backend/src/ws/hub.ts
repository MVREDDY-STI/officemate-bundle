/** WebSocket connection hub — manages all live clients and broadcasts events */

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
