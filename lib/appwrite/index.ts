"use server";

import { appwriteConfig } from "./config";

let appwritePromise: Promise<typeof import("node-appwrite")> | null = null;

const ensureNodeFetch = () => {
  if (!process.env.FORCE_NODE_FETCH) {
    process.env.FORCE_NODE_FETCH = "1";
  }
};

export const getAppwrite = async () => {
  ensureNodeFetch();

  if (!appwritePromise) {
    appwritePromise = import("node-appwrite");
  }

  return appwritePromise;
};

export const getAppwriteFile = async () => {
  ensureNodeFetch();
  return import("node-appwrite/file");
};

export const createAdminClient = async () => {
  const { Client, Databases, Storage } = await getAppwrite();
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
