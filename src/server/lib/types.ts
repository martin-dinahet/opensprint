import type { server } from "../index";
import type { auth } from "./auth.js";

export type ServerType = typeof server;

export type ServerVariables = {
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
  };
};
