"use server";

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { parseStringify } from "@/lib/utils";
import { cookies } from "next/headers";
import { ID } from "node-appwrite";

export const signIn = async (credentials: LoginUser): Promise<boolean> => {
  const { email, password } = credentials;

  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession({
      email,
      password,
    });

    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return true;
  } catch (error) {
    console.error("Error", error);
    return false;
  }
};

export const signUp = async (userData: SignUpParams): Promise<User | null> => {
  try {
    const { account, user } = await createAdminClient();
    const newUser = await user.create(
      ID.unique(),
      userData.email,
      null,
      userData.password,
      `${userData.firstName} ${userData.lastName}`,
    );

    const session = await account.createEmailPasswordSession({
      email: userData.email,
      password: userData.password,
    });

    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return {
      $id: newUser.$id,
      email: newUser.email,
      name: newUser.name,
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
    const user = await account.get();
    return parseStringify(user);
  } catch {
    return null;
  }
}
