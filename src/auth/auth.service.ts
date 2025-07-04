import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import db from "../drizzle/db";
import { TIUser, UsersTable, TSUser, TSUserLoginInput, DoctorsTable } from "../drizzle/schema";

// register a user
export const createUserService = async (user: TIUser) => {
  const {
  specialization,
  availableDays,
  ...userData
} = user;

  // Step 1: Create the user
  const [created] = await db.insert(UsersTable).values(userData).returning();
  const userId = created.userId;


  // Step 2: If doctor, insert into DoctorsTable
  if (created.role === "doctor") {
    if (!specialization || !availableDays) {
      throw new Error("Missing specialization or availableDays for doctor role.");
    }

    await db.insert(DoctorsTable).values({
      doctorId: userId,
      specialization,
      availableDays: availableDays as string[]
    });
  }

  return created;
};


// verify a user
export const verifyUserService = async (email: string) => {
    await db.update(UsersTable)
        .set({ isVerified: true, verificationCode: null })
        .where(sql`${UsersTable.email} = ${email}`);
}

// login  a user
export const userLoginService = async (userInput: TSUserLoginInput) => {
    const { email } = userInput;

    return await db.query.UsersTable.findFirst({
        columns: {
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            password: true,
            role: true,
            isVerified: true
        },
        where: sql`${UsersTable.email} = ${email}`
    });
}

// get all users 
export const getUsersService = async () => {
    const users = await db.query.UsersTable.findMany();
    return users;
}

// get user by id
export const getUserByIdService = async (id: number) => {
    const user = await db.query.UsersTable.findFirst({
        where: eq(UsersTable.userId, id)
    })
    return user;
}
//get user by email
export const getUserByEmailService = async (email: string) => {
    return await db.query.UsersTable.findFirst({
        where: sql`${UsersTable.email} = ${email}`
    });
}; 

// update user by id
export const updateUserService = async (id: number, user: TIUser) => {
  const {
    specialization,
    availableDays,
    ...userData
  } = user;

  // Step 1: Get the current user before update
  const [existingUser] = await db
    .select()
    .from(UsersTable)
    .where(eq(UsersTable.userId, id));

  if (!existingUser) {
    throw new Error("User not found.");
  }

  // Step 2: Update the user in UsersTable
  const [updatedUser] = await db
    .update(UsersTable)
    .set(userData)
    .where(eq(UsersTable.userId, id))
    .returning();

  // Step 3: Doctor logic
  const isNowDoctor = updatedUser.role === "doctor";
  const wasDoctor = existingUser.role === "doctor";

  if (isNowDoctor) {
    const [doctorRecord] = await db
      .select()
      .from(DoctorsTable)
      .where(eq(DoctorsTable.doctorId, id));

    if (doctorRecord) {
      // Update doctor record if values are provided
      if (specialization || availableDays) {
        await db
          .update(DoctorsTable)
          .set({
            ...(specialization && { specialization }),
            ...(availableDays && { availableDays: availableDays as string[] }),
          })
          .where(eq(DoctorsTable.doctorId, id));
      }
    } else {
      // Insert new doctor record if it doesn't exist
      if (!specialization || !availableDays) {
        throw new Error("Doctor record missing specialization or availableDays.");
      }
      await db.insert(DoctorsTable).values({
        doctorId: id,
        specialization,
        availableDays: availableDays as string[],
      });
    }
  }

  // Step 4: If role was doctor and is no longer doctor, delete doctor record
  if (wasDoctor && !isNowDoctor) {
    await db.delete(DoctorsTable).where(eq(DoctorsTable.doctorId, id));
  }

  return "User updated successfully";
};

// delete user by id
export const deleteUserService = async (id: number) => {
    await db.delete(UsersTable).where(eq(UsersTable.userId, id)).returning();
    return "User deleted successfully";
}