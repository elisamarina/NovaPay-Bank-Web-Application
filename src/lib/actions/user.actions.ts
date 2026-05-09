"use server";

import { createSessionClient, createAdminClient } from "@/lib/appwrite";
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
    // mutation / Database / Make fetch
    return null;
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
