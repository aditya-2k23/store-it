"use server";

import { Client, Databases, Storage } from "node-appwrite";
import { appwriteConfig } from "./config";

export const createAdminClient = async () => {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpointUrl)
    .setProject(appwriteConfig.projectId)
    .setKey(appwriteConfig.secretKey);

  return {
    get databases() {
      return new Databases(client);
    },

    get storage() {
      return new Storage(client);
    },
  };
};
