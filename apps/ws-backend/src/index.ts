import { WebSocket, WebSocketServer } from 'ws';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8082 });

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded?.userId ?? null;
  } catch {
    return null;
  }
}

/* ---------------- CONNECTION ---------------- */

wss.on("connection", (ws, request) => {
  const url = request.url;
  if (!url) return;

  const query = new URLSearchParams(url.split("?")[1]);
  const token = query.get("token") || "";
  const userId = checkUser(token);

  if (!userId) {
    ws.close();
    return;
  }

  users.push({ ws, rooms: [], userId });

  ws.on("message", async (raw) => {
    let parsedData = typeof raw === "string" ? JSON.parse(raw) : JSON.parse(raw.toString());
    console.log("message received");
    console.log(parsedData);

    /* ---------------- JOIN ROOM ---------------- */
    if (parsedData.type === "join_room") {
      const user = users.find(u => u.ws === ws);
      if (user) user.rooms.push(parsedData.roomId);
      return;
    }

    /* ---------------- LEAVE ROOM ---------------- */
    if (parsedData.type === "leave_room") {
      const user = users.find(u => u.ws === ws);
      if (!user) return;
      user.rooms = user.rooms.filter(r => r !== parsedData.roomId);
      return;
    }

    /* ---------------- CREATE SHAPE (CHAT) ---------------- */
    if (parsedData.type === "chat") {
      const { roomId, message } = parsedData;

      // Save TEXT or SHAPE to DB
      const chat = await prismaClient.chat.create({
        data: {
          roomId: Number(roomId),
          message,
          userId,
        },
      });

      // Notify sender to attach DB ID to the shape
      ws.send(
        JSON.stringify({
          type: "saved",
          shapeId: JSON.parse(message).shape.id, // frontend canvas ID
          dbId: chat.id, // DB unique ID
        })
      );

      // Broadcast shape to room
      users.forEach(u => {
        if (u.rooms.includes(roomId)) {
          u.ws.send(JSON.stringify({
            type: "chat",
            message,
            roomId,
            dbId: chat.id
          }));
        }
      });

      return;
    }

    /* ---------------- UPDATE SHAPE ---------------- */
    if (parsedData.type === "update") {
      const { roomId, id, shape } = parsedData;

      if (!id) {
        console.log("❌ ERROR: update without dbId");
        return;
      }

      await prismaClient.chat.update({
        where: { id },
        data: {
          message: JSON.stringify({ shape }),
        },
      });

      // Broadcast update
      users.forEach(u => {
        if (u.rooms.includes(roomId)) {
          u.ws.send(JSON.stringify(parsedData));
        }
      });

      return;
    }

    /* ---------------- DELETE SHAPE ---------------- */
    if (parsedData.type === "delete") {
      const { roomId, id } = parsedData;

      if (!id) {
        console.log(" ERROR: delete without dbId");
        return;
      }

      await prismaClient.chat.delete({
        where: { id },
      });

      users.forEach(u => {
        if (u.rooms.includes(roomId)) {
          u.ws.send(JSON.stringify(parsedData));
        }
      });

      return;
    }

    if (parsedData.type === "clear_all") {
      const roomId = parsedData.roomId;
    
      // DELETE all shapes/messages from DB for this room
      await prismaClient.chat.deleteMany({
        where: { roomId: Number(roomId) }
      });
    
      // Broadcast to all users in room
      users.forEach(user => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(JSON.stringify({
            type: "clear_all",
            roomId
          }));
        }
      });
    }
    
    
  });
});
