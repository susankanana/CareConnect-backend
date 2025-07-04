import { Role } from "../../src/drizzle/schema";

declare global {
  namespace Express {
    interface Request {
      user?: { //injected in your bearerAuth middleware after decoding a JWT.
        id: number;
        role: Role;
        [key: string]: any;
      };
    }
  }
}

export {};
