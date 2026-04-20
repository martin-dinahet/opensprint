import { Hono } from "hono";

export const HealthRoute = new Hono() //
	.get("/", (c) => {
		return c.json({ status: "OK" });
	});
