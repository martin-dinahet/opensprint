"use client";

import { hc } from "hono/client";
import { useEffect, useState } from "react";
import type { ServerType } from "@/server";

export default function Home() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const client = hc<ServerType>(process.env.BETTER_AUTH_URL || "").api;
      const a = await client.health.$get();
      const b = await a.json();
      setMessage(b.status);
    };
    fetchData();
  }, []);

  if (!message) return <p>Loading...</p>;

  return <p>{message}</p>;
}
