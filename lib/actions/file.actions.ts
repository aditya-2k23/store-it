"use server";

import type { Models } from "node-appwrite";
import { createAdminClient, getAppwrite, getAppwriteFile } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { constructFileUrl, getFileType, parseStringify } from "../utils";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getCurrentUser } from "./user.actions";

const handleError = (error: unknown, message: string) => {
  console.error(message, error);
  throw error;
};

const TOTAL_SPACE_CACHE_TAG = "total-space-used";
const TOTAL_SPACE_PAGE_SIZE = 200;

export const uploadFile = async ({
  file,
  ownerId,
  accountId,
  path,
}: UploadFileProps) => {
  const { ID } = await getAppwrite();
  const { InputFile } = await getAppwriteFile();
  const { storage, databases } = await createAdminClient();

  try {
    const inputFile = InputFile.fromBuffer(file, file.name);

    const bucketFile = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      inputFile,
    );

    const fileDocument = {
      type: getFileType(bucketFile.name).type,
      name: bucketFile.name,
      url: constructFileUrl(bucketFile.$id),
      extension: getFileType(bucketFile.name).extension,
      size: bucketFile.sizeOriginal,
      owner: ownerId,
      accountId,
      users: [],
      bucketFileId: bucketFile.$id,
    };

    const newFile = await databases
      .createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        ID.unique(),
        fileDocument,
      )
      .catch(async (error: unknown) => {
        await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
        handleError(error, "Failed to delete document");
      });

    revalidatePath(path);
    revalidateTag(TOTAL_SPACE_CACHE_TAG);

    return parseStringify(newFile);
  } catch (error) {
    handleError(error, "Failed to upload file");
  }
};

const createQueries = (
  Query: typeof import("node-appwrite").Query,
  currentUser: Models.Document & { email: string },
  types: string[],
  searchText: string,
  sort: string,
  limit?: number,
  offset?: number,
) => {
  const queries = [
    Query.or([
      Query.equal("owner", currentUser.$id),
      Query.contains("users", [currentUser.email]),
    ]),
  ];

  if (types.length > 0) queries.push(Query.equal("type", types));
  if (searchText) queries.push(Query.contains("name", searchText));
  if (limit !== undefined) queries.push(Query.limit(limit));
  if (offset !== undefined) queries.push(Query.offset(offset));

  const [sortBy, orderBy] = sort.split("-");

  queries.push(
    orderBy === "asc" ? Query.orderAsc(sortBy) : Query.orderDesc(sortBy),
  );

  return queries;
};

export const getFiles = async ({
  types = [],
  searchText = "",
  sort = "$createdAt-desc",
  limit,
  offset,
}: GetFilesProps) => {
  const { Query } = await getAppwrite();
  const { databases } = await createAdminClient();

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) throw new Error("User not found");

    const queries = createQueries(
      Query,
      currentUser,
      types,
      searchText,
      sort,
      limit,
      offset,
    );

    const files = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      queries,
    );

    return parseStringify(files);
  } catch (error) {
    handleError(error, "Failed to get files");
  }
};

export const renameFile = async ({
  fileId,
  name,
  extension,
  path,
}: RenameFileProps) => {
  const { databases } = await createAdminClient();

  try {
    const newName = `${name}.${extension}`;
    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId,
      {
        name: newName,
      },
    );
    revalidatePath(path);

    return parseStringify(updatedFile);
  } catch (error) {
    handleError(error, "Failed to rename file");
  }
};

export const updateFileUsers = async ({
  fileId,
  emails,
  path,
}: UpdateFileUsersProps) => {
  const { databases } = await createAdminClient();

  try {
    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId,
      {
        users: emails,
      },
    );
    revalidatePath(path);

    return parseStringify(updatedFile);
  } catch (error) {
    handleError(error, "Failed to update file");
  }
};

export const deleteFileUsers = async ({
  fileId,
  bucketFileId,
  path,
}: DeleteFileProps) => {
  const { databases, storage } = await createAdminClient();

  try {
    const deletedFile = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId,
    );

    if (deletedFile) {
      await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);
    }

    revalidatePath(path);
    revalidateTag(TOTAL_SPACE_CACHE_TAG);

    return parseStringify({ status: "success" });
  } catch (error) {
    handleError(error, "Failed to update file");
  }
};

export async function getTotalSpaceUsed() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User is not authenticated.");

    const totalSpace = await getCachedTotalSpaceUsed(currentUser.$id);

    return parseStringify(totalSpace);
  } catch (error) {
    handleError(error, "Error calculating total space used:, ");
  }
}

const listOwnerFiles = async (ownerId: string) => {
  const { Query } = await getAppwrite();
  const { databases } = await createAdminClient();

  const documents: Models.Document[] = [];
  let cursor: string | undefined;

  while (true) {
    const queries = [
      Query.equal("owner", [ownerId]),
      Query.select(["$id", "type", "size", "$updatedAt"]),
      Query.orderAsc("$id"),
      Query.limit(TOTAL_SPACE_PAGE_SIZE),
    ];

    if (cursor) queries.push(Query.cursorAfter(cursor));

    const page = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      queries,
    );

    documents.push(...page.documents);

    if (page.documents.length < TOTAL_SPACE_PAGE_SIZE) break;

    cursor = page.documents[page.documents.length - 1].$id;
  }

  return documents;
};

const computeTotalSpaceUsed = async (ownerId: string) => {
  const files = await listOwnerFiles(ownerId);

  const totalSpace = {
    image: { size: 0, latestDate: "" },
    document: { size: 0, latestDate: "" },
    video: { size: 0, latestDate: "" },
    audio: { size: 0, latestDate: "" },
    other: { size: 0, latestDate: "" },
    used: 0,
    all: 2 * 1024 * 1024 * 1024 /* 2GB available bucket storage */,
  };

  files.forEach((file) => {
    const fileType = (file.type as FileType) || "other";
    if (!totalSpace[fileType]) return;

    const size = typeof file.size === "number" ? file.size : 0;
    totalSpace[fileType].size += size;
    totalSpace.used += size;

    if (
      !totalSpace[fileType].latestDate ||
      new Date(file.$updatedAt) > new Date(totalSpace[fileType].latestDate)
    ) {
      totalSpace[fileType].latestDate = file.$updatedAt;
    }
  });

  return totalSpace;
};

const getCachedTotalSpaceUsed = unstable_cache(
  async (ownerId: string) => computeTotalSpaceUsed(ownerId),
  [TOTAL_SPACE_CACHE_TAG],
  { revalidate: 300, tags: [TOTAL_SPACE_CACHE_TAG] },
);
