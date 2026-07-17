import { account } from "./appwrite";
import type { Models } from "appwrite";

let currentUser: Models.User<Models.Preferences> | null = null;

export async function signUp(email: string, password: string, name: string) {
  await account.create("unique()", email, password, name);
  return signIn(email, password);
}

export async function signIn(email: string, password: string) {
  try {
    const existing = await account.get();
    currentUser = existing;
    return existing;
  } catch {
    // No session — create one
  }
  await account.createEmailPasswordSession(email, password);
  currentUser = await account.get();
  return currentUser;
}

export async function signOut() {
  await account.deleteSession("current");
  currentUser = null;
}

export async function getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
  try {
    if (currentUser) return currentUser;
    currentUser = await account.get();
    return currentUser;
  } catch {
    return null;
  }
}

export function clearCachedUser() {
  currentUser = null;
}
