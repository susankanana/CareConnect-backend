import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import db from "../drizzle/db";
import { TIUser, UsersTable, TSUser, TSUserLoginInput, DoctorsTable } from "../drizzle/schema";

// register a user
export const createUserService = async (user: TIUser) => {
  const {
    specialization,
    availableDays,
    experience,
    patients,
    rating,
    ...userData
  } = user;

  // Step 1: Create user
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
      availableDays: availableDays as string[],
      experience: experience ?? 0,
      patients: patients ?? 0,
      rating: rating ?? 4.5,
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
    experience,
    patients,
    rating,
    ...userData
  } = user;

  const [existingUser] = await db
    .select()
    .from(UsersTable)
    .where(eq(UsersTable.userId, id));

  if (!existingUser) {
    throw new Error("User not found.");
  }

  const [updatedUser] = await db
    .update(UsersTable)
    .set(userData)
    .where(eq(UsersTable.userId, id))
    .returning();

  const isNowDoctor = updatedUser.role === "doctor";
  const wasDoctor = existingUser.role === "doctor";

  if (isNowDoctor) {
    const [doctorRecord] = await db
      .select()
      .from(DoctorsTable)
      .where(eq(DoctorsTable.doctorId, id));

    const doctorData = {
      ...(specialization && { specialization }),
      ...(availableDays && { availableDays: availableDays as string[] }),
      ...(experience !== undefined && { experience }),
      ...(patients !== undefined && { patients }),
      ...(rating !== undefined && { rating }),
    };

    if (doctorRecord) {
      if (Object.keys(doctorData).length > 0) {
        await db
          .update(DoctorsTable)
          .set(doctorData)
          .where(eq(DoctorsTable.doctorId, id));
      }
    } else {
      if (!specialization || !availableDays) {
        throw new Error("Doctor record missing specialization or availableDays.");
      }

      await db.insert(DoctorsTable).values({
        doctorId: id,
        specialization,
        availableDays: availableDays as string[],
        experience: experience ?? 0,
        patients: patients ?? 0,
        rating: rating ?? 4.5,
      });
    }
  }

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