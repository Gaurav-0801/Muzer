import { WebSocket } from "ws";
import { Queue } from "bullmq";

interface User {
  userId: string;
  ws: WebSocket;
}

export class RoomManager {
  private static instance: RoomManager;
  public users: Map<string, User> = new Map();
  public queue!: Queue;

  private constructor() {}

  static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  async initRedisClient() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error("❌ REDIS_URL is not defined in .env");
    }

    this.queue = new Queue("stream-queue", {
      connection: {
        url: redisUrl, // ✅ this line uses your REDIS_URL properly
      },
    });

    console.log("🔌 Redis queue initialized:", redisUrl);
  }

  disconnect(ws: WebSocket) {
    for (const [userId, user] of this.users.entries()) {
      if (user.ws === ws) {
        this.users.delete(userId);
        console.log(`👋 Disconnected: ${userId}`);
        break;
      }
    }
  }

  joinRoom(spaceId: string, creatorId: string, userId: string, ws: WebSocket, token: string) {
    this.users.set(userId, { userId, ws });
    console.log(`✅ Joined room: ${userId} → ${spaceId}`);
  }

  async addToQueue(spaceId: string, userId: string, url: string) {
    console.log(`📥 Queue: ${url} by ${userId} in ${spaceId}`);
    await this.queue.add("add-to-queue", { spaceId, userId, url });
  }

  async payAndPlayNext(spaceId: string, userId: string, url: string) {
    console.log(`💸 Pay & Play: ${url} by ${userId} in ${spaceId}`);
    await this.queue.add("pay-and-play-next", { spaceId, userId, url });
  }

  async castVote(userId: string, streamId: string, vote: "upvote" | "downvote", spaceId: string) {
    console.log(`🗳️ ${vote} by ${userId} on ${streamId} in ${spaceId}`);
  }
}
