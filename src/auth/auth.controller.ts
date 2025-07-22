import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { createUserService,verifyUserService,userLoginService,getUsersService, getUserByIdService,getUserByEmailService, updateUserService, deleteUserService } from './auth.service';
import jwt from 'jsonwebtoken';
import { sendEmail } from "../mailer/mailer";
import { TSUserLoginInput } from "../drizzle/schema";


// create user controller
export const registerUserController = async (req: Request, res: Response) => {
    try {
        const user = req.body;
        const password = user.password;
        const hashedPassword = await bcrypt.hashSync(password, 10);
        user.password = hashedPassword;

        // Generate a 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = verificationCode;
        user.isVerified = false;

        const createUser = await createUserService(user);
        if (!createUser) return res.json({ message: "User not created" })

        try {
            await sendEmail(
                user.email,
                    "CareConnect Account Verification",
                    `Hello ${user.firstName} ${user.lastName}, please verify your account with the code below.`,
                    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: linear-gradient(to bottom right, #f0fdfa, #fff0f6); border-radius: 12px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #0f766e;">🏥 Welcome to CareConnect</h2>
                        <p style="font-size: 16px; color: #333;">Dear <strong>${user.firstName} ${user.lastName}</strong>,</p>
                        <p style="font-size: 16px; color: #333;">Thank you for registering with <strong>CareConnect</strong>, a medical appointment and patient management system.</p>
                        <p style="font-size: 16px; color: #333;">Your verification code is:</p>
                        <div style="font-size: 24px; font-weight: bold; color: #0ea5e9; background-color: #ecfeff; padding: 10px 20px; display: inline-block; border-radius: 6px;">
                            ${verificationCode}
                        </div>
                        <p style="margin-top: 20px; font-size: 14px; color: #555;">Please enter this code in the app to verify your account.</p>
                        <hr style="margin: 30px 0;">
                        <p style="font-size: 12px; color: #888;">If you did not request this, please ignore this email or contact our support.</p>
                        <p style="font-size: 12px; color: #888;">&copy; 2025 CareConnect. All rights reserved.</p>
                    </div>`
                );

        } catch (emailError) {
            console.error("Failed to send registration email:", emailError);
        }
        return res.status(201).json({ message: "User created. Verification code sent to email." })

    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

export const verifyUserController = async (req: Request, res: Response) => {
    const { email, code } = req.body;   //use these exact names while routing
    try {
        const user = await getUserByEmailService(email);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.verificationCode === code) {
            await verifyUserService(email);

            // Send verification success email
            try {
                await sendEmail(
                    user.email,
                    "CareConnect Account Verified Successfully",
                    `Hello ${user.firstName} ${user.lastName}, your CareConnect account has been successfully verified! You can now log in and access all features.`,
                    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #0f172a; text-align: center; margin-bottom: 20px;">🎉 Account Verified Successfully!</h2>
                        <p style="font-size: 16px; color: #333;">Dear <strong>${user.firstName} ${user.lastName}</strong>,</p>
                        <p style="font-size: 16px; color: #333;">
                            We are thrilled to inform you that your <strong>CareConnect</strong> account has been <strong>successfully verified</strong>!
                        </p>
                        <p style="font-size: 16px; color: #333;">
                            You can now log in and start managing your appointments with ease.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:5173/login"
                                style="background: linear-gradient(to right, #14b8a6, #ec4899); color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                                Log In to CareConnect
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #555; text-align: center;">
                            If you have any questions or need assistance, contact our support team.
                        </p>
                        <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #888; text-align: center;">
                            &copy; 2025 CareConnect. All rights reserved.
                        </p>
                    </div>`
                );

            } catch (error: any) {
                console.error("Failed to send verification success email:", error);

            }
            return res.status(200).json({ message: "User verified successfully" });
        } else {
            return res.status(400).json({ message: "Invalid verification code" });
        }
    } catch (error: any) {
        return res.status(500).json({ error: error.message });

    }
}

export const loginUserController = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body as TSUserLoginInput; //ensures TypeScript knows that req.body *should* have email and password.

         if (!email || typeof email !== 'string' || email.trim() === '') {
            return res.status(400).json({ message: "Email is required and must be a non-empty string." });
        }
        if (!password || typeof password !== 'string' || password.length === 0) {
            return res.status(400).json({ message: "Password is required and must be a non-empty string." });
        }
        
        const userExist = await userLoginService({ email, password });

        if (!userExist) {
            return res.status(404).json({ message: "User not found" });
        }

        const userMatch = await bcrypt.compare(password, userExist.password as string);

        if (!userMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        //Generate JWT Token
        const secret = process.env.JWT_SECRET;

        // Essential: Check if JWT_SECRET is defined
        if (!secret) {
            console.error("Critical Error: JWT_SECRET environment variable is not defined!");
            return res.status(500).json({ message: "Server configuration error. Please try again later." });
        }

        // Create the JWT payload
        const payload = {
            sub: userExist.userId,
            user_id: userExist.userId,
            first_name: userExist.firstName,
            last_name: userExist.lastName,
            role: userExist.role,
            isVerified: userExist.isVerified,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 3 // 3 days expiration in seconds
        };

        const token = jwt.sign(payload, secret);

        return res.status(200).json({
            message: "Login Successful",
            token,
            user: { // Return necessary user info, but NEVER the password
                user_id: userExist.userId,
                first_name: userExist.firstName,
                last_name: userExist.lastName,
                email: userExist.email,
                role: userExist.role,
                isVerified: userExist.isVerified
            }
        });

    } catch (error: any) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: "An unexpected error occurred during login." });
    }
}

// get all users controller
export const getUsersController = async (req: Request, res: Response) => {
    try {
        const users = await getUsersService()
        if (!users || users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }
        return res.status(200).json({ data: users });

    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

// get user by id controller
export const getUserByIdController = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }

        const user = await getUserByIdService(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ data: user });

    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

// update user by id controller
export const updateUserController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const user = req.body;

    //Hash the password if it's being updated
    if (user.password) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;
    }

    const existingUser = await getUserByIdService(id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await updateUserService(id, user);
    if (!updatedUser) {
      return res.status(400).json({ message: "User not updated" });
    }

    return res.status(200).json({ message: "User updated successfully" });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
// delete user by id controller

export const deleteUserController = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }

        const existingUser = await getUserByIdService(id);
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const deleted = await deleteUserService(id);
        if (!deleted) {
            return res.status(400).json({ message: "User not deleted" });
        }

        return res.status(204).json({ message: "User deleted successfully" });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}