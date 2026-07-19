import { account, ID } from "./appwrite";
import type { Models } from "appwrite";

let currentUser: Models.User<Models.Preferences> | null = null;

export async function signUp(email: string, password: string, name: string) {
  await account.create({ userId: ID.unique(), email, password, name });
  await account.createEmailPasswordSession({ email, password });
  currentUser = await account.get();
  const origin = window.location.origin;
  await account.createVerification({ url: `${origin}/verify` });
}

export async function resendVerification() {
  const origin = window.location.origin;
  await account.createVerification({ url: `${origin}/verify` });
}

export async function verifyEmail(userId: string, secret: string) {
  await account.updateVerification({ userId, secret });
}

export async function sendPasswordRecovery(email: string) {
  const origin = window.location.origin;
  await account.createRecovery({ email, url: `${origin}/reset-password` });
}

export async function resetPassword(userId: string, secret: string, password: string) {
  await account.updateRecovery({ userId, secret, password });
}

export async function signIn(email: string, password: string) {
  await account.createEmailPasswordSession({ email, password });
  currentUser = await account.get();
  return currentUser;
}

export async function signOut() {
  await account.deleteSession({ sessionId: "current" });
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
