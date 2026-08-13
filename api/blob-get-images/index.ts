import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as sql from "mssql";
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

// Import your database configuration and initialization
import { baseConfig } from "../dbConfig";
import { initializePool } from "../services/dbService";

// Define the ParsedConnectionString interface with an index signature
interface ParsedConnectionString {
  AccountName?: string;
  AccountKey?: string;
  [key: string]: string | undefined; // Index signature added
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
 * @param blobServiceClient The BlobServiceClient instance.
 * @param containerName The name of the container.
 * @param blobName The name of the blob.
 * @param sharedKeyCredential The StorageSharedKeyCredential instance.
 * @param accountName The Azure Storage account name.
 * @param context The Azure Function context for logging.
 * @returns The generated SAS URL as a string.
 */
async function generateSasUrlLocal(
  blobServiceClient: BlobServiceClient,
  containerName: string,
  blobName: string,
  sharedKeyCredential: StorageSharedKeyCredential,
  accountName: string,
  context: Context
): Promise<string> {
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

    context.log(`Generating SAS token for blob '${blobName}' in container '${containerName}' (Local Environment).`);

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential
    ).toString();

    const blobClient: BlobClient = blobServiceClient
      .getContainerClient(containerName)
      .getBlobClient(blobName);

    const sasUrl = `${blobClient.url}?${sasToken}`;
    context.log(`SAS URL generated successfully for blob '${blobName}': ${sasUrl}`);
    return sasUrl;
  } catch (error) {
    context.log.error(`Error generating SAS URL for blob '${blobName}' in local environment:`, error);
    throw new Error(`Failed to generate SAS URL for blob '${blobName}' in local environment.`);
  }
}

/**
 * Generates a SAS URL for a blob in a deployed environment using UserDelegationKey.
 * @param blobServiceClient The BlobServiceClient instance.
 * @param containerName The name of the container.
 * @param blobName The name of the blob.
 * @param userDelegationKey The UserDelegationKey instance.
 * @param accountName The Azure Storage account name.
 * @param context The Azure Function context for logging.
 * @returns The generated SAS URL as a string.
 */
async function generateSasUrlDeployed(
  blobServiceClient: BlobServiceClient,
  containerName: string,
  blobName: string,
  userDelegationKey: UserDelegationKey,
  accountName: string,
  context: Context
): Promise<string> {
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

    context.log(`Generating SAS token for blob '${blobName}' in container '${containerName}' (Deployed Environment).`);

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      userDelegationKey,
      accountName // Pass the account name as the third parameter
    ).toString();

    const blobClient: BlobClient = blobServiceClient
      .getContainerClient(containerName)
      .getBlobClient(blobName);

    const sasUrl = `${blobClient.url}?${sasToken}`;
    context.log(`SAS URL generated successfully for blob '${blobName}': ${sasUrl}`);
    return sasUrl;
  } catch (error) {
    context.log.error(`Error generating SAS URL for blob '${blobName}' in deployed environment:`, error);
    throw new Error(`Failed to generate SAS URL for blob '${blobName}' in deployed environment.`);
  }
}

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log("HTTP trigger function processed a request to fetch images.");

  // Extract query parameters
  const submissionLocation = req.query.submissionLocation;
  const submissionId = req.query.submissionId;

  if (!submissionLocation || !submissionId) {
    context.log.warn("Missing required query parameters: submissionLocation or submissionId.");
    context.res = {
      status: 400,
      body: "Both submissionLocation and submissionId query parameters are required."
    };
    return;
  }

  let pool: sql.ConnectionPool | undefined;

  try {
    // 1. Connect to the database
    context.log("Initializing database connection pool.");
    pool = await initializePool(baseConfig.toolsDashboard.database, baseConfig.toolsDashboard);
    const request = new sql.Request(pool);

    request.input("submissionLocation", sql.VarChar, submissionLocation);
    request.input("submissionId", sql.Int, submissionId);

    const query = `
      SELECT file_url
      FROM field_tracker.image_uploads
      WHERE submission_location = @submissionLocation
        AND submission_id = @submissionId
    `;

    context.log(`Executing SQL query to fetch blob URLs for submissionLocation='${submissionLocation}' and submissionId='${submissionId}'.`);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      context.log.warn(`No images found for submissionLocation='${submissionLocation}' and submissionId='${submissionId}'.`);
      context.res = {
        status: 200,
        body: `No images found for submissionLocation="${submissionLocation}" and submissionId="${submissionId}".`
      };
      return;
    }

    // 2. Determine environment and instantiate BlobServiceClient
    const isLocal = process.env.IsLocal === "true";
    const connectionString = process.env.BLOB_STORAGE_CONNECTION_STRING; // Ensure this is set locally

    const storageAccountName = process.env.STORAGE_ACCOUNT_NAME;
    const containerName = process.env.BlobContainerName || "";

    if (!storageAccountName) {
      context.log.error("Storage account name is not configured in environment variables.");
      context.res = {
        status: 500,
        body: "Storage account name is not configured."
      };
      return;
    }

    let sharedKeyCredential: StorageSharedKeyCredential | null = null;
    let userDelegationKey: UserDelegationKey | null = null;
    let blobServiceClient: BlobServiceClient;

    if (isLocal) {
      context.log("Running in local environment. Using connection string for BlobServiceClient.");
      if (!connectionString) {
        context.log.error("Blob connection string is not configured for local environment.");
        throw new Error("Blob connection string is not configured for local environment.");
      }
      blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

      // Extract account name and key from connection string
      const parsedConnectionString = parseConnectionString(connectionString);
      if (!parsedConnectionString.AccountName || !parsedConnectionString.AccountKey) {
        context.log.error("Invalid connection string. AccountName or AccountKey missing.");
        throw new Error("Invalid connection string. AccountName or AccountKey missing.");
      }
      sharedKeyCredential = new StorageSharedKeyCredential(parsedConnectionString.AccountName, parsedConnectionString.AccountKey);
      context.log("StorageSharedKeyCredential created successfully for local environment.");
    } else {
      context.log("Running in deployed environment. Using DefaultAzureCredential for BlobServiceClient.");
      blobServiceClient = new BlobServiceClient(
        `https://${storageAccountName}.blob.core.windows.net`,
        new DefaultAzureCredential()
      );

      // Get User Delegation Key
      const now = new Date();
      const expiresOn = new Date(now.valueOf() + 60 * 60 * 1000); // 1 hour from now

      context.log("Requesting User Delegation Key for SAS token generation.");
      userDelegationKey = await blobServiceClient.getUserDelegationKey(now, expiresOn);
      context.log("User Delegation Key obtained successfully for deployed environment.");
    }

    // 3. Generate SAS URLs for each blob
    context.log("Generating SAS URLs for retrieved blobs.");
    const images: string[] = await Promise.all(
      result.recordset.map(async (row: { file_url: string }) => {
        const fileUrl = row.file_url;

        // Extract the blob name from the full URL
        let blobName: string;
        try {
          blobName = extractBlobName(fileUrl);
        } catch (extractionError) {
          context.log.error(`Error extracting blob name from URL '${fileUrl}':`, extractionError);
          throw extractionError;
        }

        try {
          if (isLocal && sharedKeyCredential) {
            // Local environment: use shared key credential
            context.log(`Generating SAS URL locally for blob '${blobName}'.`);
            const sasUrl = await generateSasUrlLocal(blobServiceClient, containerName, blobName, sharedKeyCredential, storageAccountName, context);
            return sasUrl;
          } else if (userDelegationKey) {
            // Deployed environment: use user delegation key
            context.log(`Generating SAS URL in deployed environment for blob '${blobName}'.`);
            const sasUrl = await generateSasUrlDeployed(blobServiceClient, containerName, blobName, userDelegationKey, storageAccountName, context);
            return sasUrl;
          } else {
            context.log.error(`Missing credentials for generating SAS URL for blob '${blobName}'.`);
            throw new Error(`Unable to generate SAS URL for blob '${blobName}' due to missing credentials.`);
          }
        } catch (sasError) {
          context.log.error(`Error generating SAS URL for blob '${blobName}':`, sasError);
          throw sasError; // Rethrow to be caught by the outer catch block
        }
      })
    );

    context.log("All SAS URLs generated successfully.");

    // 4. Return the SAS URLs
    context.res = {
      status: 200,
      body: { images }
    };
    context.log("Response sent successfully with SAS URLs.");
  } catch (error) {
    context.log.error("Error retrieving images:", error);
    context.res = {
      status: 500,
      body: "Failed to fetch images: " + (error as Error).message
    };
  }
};

export default httpTrigger;