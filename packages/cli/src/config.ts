import path from "node:path";

// Define monorepo paths relative to packages/cli
export const MONOREPO_ROOT = path.resolve(__dirname, "../../..");
export const APPS_DIR = path.join(MONOREPO_ROOT, "apps");
export const PACKAGES_DIR = path.join(MONOREPO_ROOT, "packages");

// Apps
export const STORE_DIR = path.join(APPS_DIR, "store");
export const WWW_DIR = path.join(APPS_DIR, "www");

// Packages
export const DB_DIR = path.join(PACKAGES_DIR, "database");
