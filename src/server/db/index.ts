import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL environment variable not found.");

export const db = drizzle(url);
