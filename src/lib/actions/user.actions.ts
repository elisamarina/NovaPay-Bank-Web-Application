"use server";

import { createSessionClient, createAdminClient } from "@/lib/appwrite";
import { ID } from "node-appwrite";
import { cookies } from "next/headers";

export const signIn = async (credentials: LoginUser): Promise<boolean> => {
  const { email, password } = credentials;
  try {
    const { account } = await createAdminClient();

    const session = await account.createEmailPasswordSession({
      email,
      password,
    });

    const cookieStore = cookies();
    if (cookieStore && typeof cookieStore.set === "function") {
      cookieStore.set("appwrite-session", session.secret, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: true,
      });
    }
    return true;
  } catch (error) {
    console.error("Error", error);
    return false;
  }
};

export const signUp = async (userData: SignUpParams): Promise<User | null> => {
  try {
    const { user } = await createAdminClient();
    // Creează userul în Appwrite (admin)
    const newUser = await user.create(
      ID.unique(),
      userData.email,
      null, // phone
      userData.password,
      `${userData.firstName} ${userData.lastName}`,
    );

    // Returnează userul nou creat (doar datele de bază)
    return {
      $id: newUser.$id,
      email: newUser.email,
      userId: newUser.$id,
      dwollaCustomerUrl: "",
      dwollaCustomerId: "",
      firstName: userData.firstName,
      lastName: userData.lastName,
      address1: userData.address1,
      city: userData.city,
      state: userData.state,
      postalCode: userData.postalCode,
      dateOfBirth: userData.dateOfBirth,
      ssn: userData.ssn,
    };
  } catch (error) {
    console.error("Error", error);
    return null;
  }
};

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch (error) {
    return null;
  }
}
