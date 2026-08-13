import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  UserDelegationKey,
  BlobSASSignatureValues,
  BlobSASPermissions,
  SASProtocol,
  BlobClient,
  generateBlobSASQueryParameters
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import sharp from "sharp";
import mime from "mime-types";
import { Context } from "@azure/functions";
import path from "path";

const isLocal = process.env.IsLocal === "true";
const connectionString = process.env.BLOB_STORAGE_CONNECTION_STRING;

const containerName = process.env.BlobContainerName || "";

interface ParsedConnectionString {
  AccountName?: string;
  AccountKey?: string;
  [key: string]: string | undefined; // Index signature added
}

const blobServiceClient = isLocal
  ? BlobServiceClient.fromConnectionString(connectionString || "")
  : new BlobServiceClient(
      `https://${process.env.STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
      new DefaultAzureCredential()
    );

export async function uploadFileToBlob(
  context: Context,
  blobName: string,
  file: Buffer,
  containerName: string
) {
  context.log("Starting uploadFileToBlob...");
  context.log("isLocal is set to:", isLocal);
  context.log("containerName is set to:", containerName);

  try {
    // Validate blob name
    if (!blobName) {
      context.log.warn("Blob name is missing.");
      return {
        message: "Invalid file name. The blob name cannot be empty.",
        error: "validation_error",
        data: {},
      };
    }

    context.log(`Original blob name: ${blobName}`);

    // Validate file buffer
    if (!file || file.length === 0) {
      context.log.warn("File buffer is empty.");
      return {
        message: "Invalid file. Buffer is empty.",
        error: "validation_error",
        data: {},
      };
    }

    // Validate MIME type
    const mimeType = mime.lookup(blobName);
    if (!mimeType || !mimeType.startsWith("image/")) {
      context.log.warn(`Invalid MIME type: ${mimeType}`);
      return {
        message: "Invalid file type. Only image files are allowed.",
        error: "validation_error",
        data: {},
      };
    }
    context.log(`MIME type validated: ${mimeType}`);

    // Generate a random suffix for the filename
    const extension = path.extname(blobName);                 // e.g. ".png"
    const baseName = path.basename(blobName, extension);      // e.g. "picture"
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueBlobName = `${baseName}-${randomSuffix}${extension}`;
    const uniqueThumbName = `thumb-${baseName}-${randomSuffix}${extension}`;

    context.log(`Unique blob name: ${uniqueBlobName}`);
    context.log(`Unique thumbnail name: ${uniqueThumbName}`);

    // Generate a thumbnail
    context.log("Generating thumbnail...");
    const thumbnail = await sharp(file).resize(200, 200).toBuffer();
    context.log("Thumbnail generated successfully.");

    // Get container client
    context.log(`Getting container client for container: ${containerName}`);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Upload main file
    context.log(`Uploading main file to blob: ${uniqueBlobName}`);
    const blockBlobClient = containerClient.getBlockBlobClient(uniqueBlobName);
    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: {
        blobContentType: mimeType, // Set the Content-Type dynamically
      },
    });
    const fileUrl = blockBlobClient.url;
    context.log(`Main file uploaded successfully. File URL: ${fileUrl}`);

    // Upload thumbnail
    context.log(`Uploading thumbnail to blob: ${uniqueThumbName}`);
    const thumbnailBlobClient = containerClient.getBlockBlobClient(uniqueThumbName);
    await thumbnailBlobClient.uploadData(thumbnail, {
      blobHTTPHeaders: {
        blobContentType: mimeType, // Use the same Content-Type for the thumbnail
      },
    });
    const thumbnailUrl = thumbnailBlobClient.url;
    context.log(`Thumbnail uploaded successfully. Thumbnail URL: ${thumbnailUrl}`);

    // Return success response
    context.log("File and thumbnail uploaded successfully.");
    return {
      message: "Blob upload success",
      error: null,
      data: {
        fileUrl,
        thumbnailUrl,
      },
    };
  } catch (error) {
    // Log the error details
    context.log.error("Error during blob upload:", error);

    return {
      message: (error as Error).message,
      error: "upload_error",
      data: error,
    };
  }
}

export async function getBlobProperties(blobName: string, containerName: string) {
  try {
    if (!blobName) {
      return {
        message: "Invalid file name. The blob name cannot be empty.",
        error: "validation_error",
        data: {},
      };
    }

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const blobProperties = await blockBlobClient.getProperties();

    return {
      message: "Blob fetch success",
      error: null,
      data: blobProperties,
    };
  } catch (error) {
    return {
      message: (error as Error).message,
      error: "get_error",
      data: error,
    };
  }
}

export async function deleteBlob(blobName: string, containerName: string) {
  try {
    if (!blobName) {
      return {
        message: "Invalid file name. The blob name cannot be empty.",
        error: "validation_error",
        data: {},
      };
    }

    const containerClient = blobServiceClient.getContainerClient(containerName);

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();

    const thumbBlobClient = containerClient.getBlockBlobClient(`thumb-${blobName}`);
    await thumbBlobClient.deleteIfExists();

    return {
      message: "Blob delete success",
      error: null,
      data: {},
    };
  } catch (error) {
    return {
      message: (error as Error).message,
      error: "delete_error",
      data: error,
    };
  }
}

/**
 * Parses the Azure Blob Storage connection string into its components.
 * @param connectionString The connection string to parse.
 * @returns An object containing the parsed connection string components.
 */
function parseConnectionString(connectionString: string): ParsedConnectionString {
  const parts = connectionString.split(";");
  const parsed: ParsedConnectionString = {};
  parts.forEach(part => {
    const [key, value] = part.split("=");
    if (key && value) {
      parsed[key] = value;
    }
  });
  return parsed;
}

/**
 * Extracts the blob name from the full blob URL.
 * @param fileUrl The full URL of the blob.
 * @returns The extracted blob name.
 * @throws Error if the URL is invalid or the blob name cannot be extracted.
 */
function extractBlobName(fileUrl: string): string {
  try {
    const url = new URL(fileUrl);
    const pathname = url.pathname; // e.g., /local-dev-images/HangingPlant-s6zvtr.jpg
    const blobName = decodeURIComponent(pathname.substring(pathname.lastIndexOf('/') + 1));
    if (!blobName) {
      throw new Error(`Blob name could not be extracted from URL: ${fileUrl}`);
    }
    return blobName;
  } catch (error) {
    throw new Error(`Invalid file URL: ${fileUrl}`);
  }
}

/**
 * Generates a SAS URL for a blob in a local environment using StorageSharedKeyCredential.
 * @param fileUrl The file URL of the image.
 * @returns The generated SAS URL as a string.
 */
export async function generateSasUrlLocal(fileUrl: string) {
  const blobName = extractBlobName(fileUrl);

  let sharedKeyCredential: StorageSharedKeyCredential | null = null;
  let blobServiceClient: BlobServiceClient;

  if (isLocal) {
    if (!connectionString) {
      throw new Error("Blob connection string is not configured for local environment.");
    }

    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

    // Extract account name and key from connection string
    const parsedConnectionString = parseConnectionString(connectionString);
    if (!parsedConnectionString.AccountName || !parsedConnectionString.AccountKey) {
      throw new Error("Invalid connection string. AccountName or AccountKey missing.");
    }
    sharedKeyCredential = new StorageSharedKeyCredential(parsedConnectionString.AccountName, parsedConnectionString.AccountKey);

    try {
      const sasOptions: BlobSASSignatureValues = {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("r"), // Read permissions
        startsOn: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes in the past
        expiresOn: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        protocol: SASProtocol.Https, // HTTPS only
        version: "2021-04-10" // Use a recent version
      };
  
      const sasToken = generateBlobSASQueryParameters(
        sasOptions,
        sharedKeyCredential
      ).toString();
  
      const blobClient: BlobClient = blobServiceClient
        .getContainerClient(containerName)
        .getBlobClient(blobName);
  
      const sasUrl = `${blobClient.url}?${sasToken}`;
      return sasUrl;
    } catch (error) {
      throw new Error(`Failed to generate SAS URL for blob '${blobName}' in local environment.`);
    }
  }
}

/**
 * Generates a SAS URL for a blob in a deployed environment using UserDelegationKey.
 * @param fileUrl The file URL of the image.
 * @returns The generated SAS URL as a string.
 */
export async function generateSasUrlDeployed(fileUrl: string) {
  const blobName = extractBlobName(fileUrl);

  const storageAccountName = process.env.STORAGE_ACCOUNT_NAME;

  let userDelegationKey: UserDelegationKey | null = null;
  let blobServiceClient: BlobServiceClient;

  blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    new DefaultAzureCredential()
  );

  // Get User Delegation Key
  const now = new Date();
  const expiresOn = new Date(now.valueOf() + 60 * 60 * 1000); // 1 hour from now

  userDelegationKey = await blobServiceClient.getUserDelegationKey(now, expiresOn);

  if (storageAccountName) {
    try {
      const sasOptions: BlobSASSignatureValues = {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("r"), // Read permissions
        startsOn: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes in the past
        expiresOn: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        protocol: SASProtocol.Https, // HTTPS only
        version: "2021-04-10" // Use a recent version
      };
  
      const sasToken = generateBlobSASQueryParameters(
        sasOptions,
        userDelegationKey,
        storageAccountName // Pass the account name as the third parameter
      ).toString();
  
      const blobClient: BlobClient = blobServiceClient
        .getContainerClient(containerName)
        .getBlobClient(blobName);
  
      const sasUrl = `${blobClient.url}?${sasToken}`;
      return sasUrl;
    } catch (error) {
      throw new Error(`Failed to generate SAS URL for blob '${blobName}' in deployed environment.`);
    }
  }
}