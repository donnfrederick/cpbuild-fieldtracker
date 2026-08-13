import * as dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
    user: string;
    password: string;
    database: string;
    server: string;
    port: number;
    pool: {
        max: number;
        min: number;
        idleTimeoutMillis: number;
    }
    options: {
      encrypt: boolean;
      trustServerCertificate: boolean;
    };
}
interface Config {
  toolsDashboard: DatabaseConfig;
  biDataWarehouse: DatabaseConfig;
  ccpdb: DatabaseConfig;
  rfmsdb: DatabaseConfig;
}

const defaultPool = {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
};
const defaultOptions = {
    encrypt: true,
    trustServerCertificate: true
};
const defaultPort = 1433;

export const baseConfig: Config = {
  toolsDashboard: {
    user: process.env.TOOLS_DASHBOARD_DB_USER || "",
    password: process.env.TOOLS_DASHBOARD_DB_PASSWORD || "",
    database: process.env.TOOLS_DASHBOARD_DB_DATABASE || "",
    server: process.env.TOOLS_DASHBOARD_DB_HOST || "",
    port: defaultPort,
    pool: defaultPool,
    options: defaultOptions
  },
  biDataWarehouse: {
    user: process.env.DATA_WAREHOUSE_DB_USER || "",
    password: process.env.DATA_WAREHOUSE_DB_PASSWORD || "",
    database: process.env.DATA_WAREHOUSE_DATABASE || "",
    server: process.env.DATA_WAREHOUSE_DB_HOST || "",
    port: defaultPort,
    pool: defaultPool,
    options: defaultOptions
  },
  ccpdb: {
    user: process.env.CCP_DB_USER || "",
    password: process.env.CCP_DB_PASSWORD || "",
    database: process.env.CCP_DATABASE || "",
    server: process.env.CCP_DB_HOST || "",
    port: defaultPort,
    pool: defaultPool,
    options: defaultOptions
  },
  rfmsdb: {
    user: process.env.RFMS_DB_USER || "",
    password: process.env.RFMS_DB_PASSWORD || "",
    database: process.env.RFMS_DB_DATABASE || "",
    server: process.env.RFMS_DB_HOST || "",
    port: 62053,
    pool: defaultPool,
    options: defaultOptions
  }
};
