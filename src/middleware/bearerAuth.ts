import jwt, { decode } from "jsonwebtoken" 
import "dotenv/config"
import { Request, Response, NextFunction } from "express";

export const checkRoles = (requiredRole: "admin" | "user" | "doctor" | "both" | "all") => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const token = authHeader.split(" ")[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string);  //jwt.verify returns the payload
            (req as any).user = decoded;

            // check for roles
            if (
                typeof decoded === "object" &&
                decoded !== null &&
                "role" in decoded
            ) {
                if (requiredRole === "both") {
                    if (decoded.role === "admin" || decoded.role === "doctor") {
                        next();
                        return;
                    }
                } else if (requiredRole === "all") {
                    if (
                        decoded.role === "admin" ||
                        decoded.role === "doctor" ||
                        decoded.role === "user"
                    ) {
                        next();
                        return;
                    }
                } else if (decoded.role === requiredRole) {
                    next();
                    return;
                }

                res.status(403).json({ message: "Forbidden: Insufficient role" });
                return;
            } else {
                res.status(401).json({ message: "Invalid Token Payload" });
                return;
            }

        } catch (error) {
            res.status(401).json({ message: "Invalid Token" });
            return;
        }
    }
}

export const adminRoleAuth = checkRoles("admin")
export const userRoleAuth = checkRoles("user")
export const doctorRoleAuth = checkRoles("doctor")
export const bothRoleAuth = checkRoles("both")
export const allRoleAuth = checkRoles("all")
