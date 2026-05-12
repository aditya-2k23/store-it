"use server";

import { createAdminClient } from "@/lib/appwrite";
import { avatarPlaceholderUrl } from "@/constants";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ID, Models, Query } from "node-appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";

type AppwriteUser = Models.Document & {
  fullName?: string;
  email?: string;
  avatar?: string;
  accountId?: string;
};

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  throw error;
};

export const getCurrentUser = async () => {
  try {
    const { userId } = await auth();

    if (!userId) return null;

    const clerkUser = await currentUser();

    if (!clerkUser) return null;

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) throw new Error("Clerk user has no email address");

    const fullName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      "User";
    const avatar = clerkUser.imageUrl || avatarPlaceholderUrl;

    const { databases } = await createAdminClient();

    const byAccountId = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("accountId", [userId])]
    );

    let userDoc: AppwriteUser | null =
      byAccountId.total > 0
        ? (byAccountId.documents[0] as AppwriteUser)
        : null;

    if (!userDoc) {
      const byEmail = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("email", [email])]
      );

      userDoc =
        byEmail.total > 0 ? (byEmail.documents[0] as AppwriteUser) : null;
    }

    if (userDoc) {
      const needsUpdate =
        userDoc.fullName !== fullName ||
        userDoc.email !== email ||
        userDoc.avatar !== avatar ||
        userDoc.accountId !== userId;

      if (!needsUpdate) return parseStringify(userDoc);

      const updatedUser = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        userDoc.$id,
        {
          fullName,
          email,
          avatar,
          accountId: userId,
        }
      );

      return parseStringify(updatedUser);
    }

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      ID.unique(),
      {
        fullName,
        email,
        avatar,
        accountId: userId,
      }
    );

    return parseStringify(newUser);
  } catch (error) {
    handleError(error, "Failed to get current user");
  }
};
