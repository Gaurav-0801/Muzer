"use client";
import { useEffect, useState } from "react";
import { useSocket } from "@/context/socket-context";
import jwt from "jsonwebtoken";
import StreamView from "@/components/StreamView";
import ErrorScreen from "@/components/ErrorScreen";
import LoadingScreen from "@/components/LoadingScreen";

export default function Component({ params: { spaceId } }: { params: { spaceId: string } }) {
  const { socket, user, loading, setUser, connectionError } = useSocket();
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [loading1, setLoading1] = useState(true);

  useEffect(() => {
    async function fetchHostId() {
      try {
        const res = await fetch(`/api/spaces/?spaceId=${spaceId}`);
        const data = await res.json();
        console.log("🎯 HostId fetch result:", data);

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to get host");
        }
        setCreatorId(data.hostId);
      } catch (err) {
        console.error("❌ Failed to fetch host ID", err);
      } finally {
        setLoading1(false);
      }
    }

    fetchHostId();
  }, [spaceId]);

  useEffect(() => {
    if (user && socket && creatorId) {
      const token =
        user.token ||
        jwt.sign(
          { creatorId, userId: user.id },
          process.env.NEXT_PUBLIC_SECRET || "default_secret",
          { expiresIn: "1d" }
        );

      const payload = {
        type: "join-room",
        data: { token, spaceId },
      };

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
      } else {
        socket.addEventListener("open", () => {
          socket.send(JSON.stringify(payload));
        });
      }

      if (!user.token) {
        setUser({ ...user, token });
      }
    }
  }, [user, socket, creatorId, spaceId]);

  if (connectionError) return <ErrorScreen>Connection failed</ErrorScreen>;
  if (loading || loading1) return <LoadingScreen />;
  if (!user) return <ErrorScreen>Please log in</ErrorScreen>;
  if (!creatorId) return <ErrorScreen>No creator ID</ErrorScreen>;
  if (user.id !== creatorId) return <ErrorScreen>You are not the host</ErrorScreen>;

  return <StreamView creatorId={creatorId} spaceId={spaceId} playVideo />;
}
