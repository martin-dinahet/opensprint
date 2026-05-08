import { hc } from "hono/client";
import type { ServerType } from "@/server";

function getAppOrigin() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return "";
  }

  return appUrl.replace(/\/$/, "");
}

const client = hc<ServerType>(getAppOrigin());

export const api = client.api;
