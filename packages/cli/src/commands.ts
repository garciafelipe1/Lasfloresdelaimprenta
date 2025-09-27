import chalk from "chalk";
import inquirer from "inquirer";
import path from "node:path";
import { DB_DIR, MONOREPO_ROOT, STORE_DIR, WWW_DIR } from "./config";
import { type CommandOptions, checkRequiredEnv, runCommand } from "./utils";

const REQUIRED_ROOT_ENV_VARS = [
  "POSTGRES_USER",
  "POSTGRES_DB",
  "POSTGRES_PASSWORD",
  "POSTGRES_PORT",
  "POSTGRES_HOST",
  "MEDUSA_EMAIL",
  "MEDUSA_PASSWORD",
  "PGADMIN_DEFAULT_EMAIL",
  "PGADMIN_DEFAULT_PASSWORD",
  "PGADMIN_PORT",
];

// Required environment variables specific to packages/database/.env
const REQUIRED_DB_ENV_VARS = ["DATABASE_URL"];

interface AddProductOptions {
  title: string;
  price: number;
  description?: string;
  verbose: boolean;
}

/**
 * Runs the full database setup and optional development server start.
 */
export async function runEntireSetup(
  options: CommandOptions & { runDev: boolean }
): Promise<void> {
  console.log(
    chalk.yellow(
      "\n⚠️  This script will DROP your database and recreate everything."
    )
  );
  const confirm = await inquirer.prompt({
    type: "confirm",
    name: "continue",
    message: chalk.red("Are you sure you want to continue?"),
    default: false,
  });

  if (!confirm.continue) {
    console.log(chalk.red("❌ Aborted by user."));
    process.exit(0);
  }

  // 1. Check root level required vars
  checkRequiredEnv(REQUIRED_ROOT_ENV_VARS);

  // 2. Load and check database specific vars from packages/database/.env
  // This will load DATABASE_URL from packages/database/.env if it exists,
  // then check if DATABASE_URL is set in process.env.
  checkRequiredEnv(REQUIRED_DB_ENV_VARS, path.join(DB_DIR, ".env"));

  // checkRequiredEnv(REQUIRED_SETUP_VARS);
  const { MEDUSA_EMAIL, MEDUSA_PASSWORD } = process.env;

  console.log(chalk.blue("\n🛠️ Setting up store...\n"));

  console.log(chalk.blue("🐘 Starting postgres service..."));
  await runCommand("docker compose down -v && docker compose up -d --build", {
    ...options,
    cwd: MONOREPO_ROOT,
  });

  console.log(chalk.blue("Waiting for the database to become healthy..."));
  await new Promise((resolve) => {
    const checkDbHealth = setInterval(async () => {
      try {
        await runCommand(
          "docker inspect -f '{{.State.Health.Status}}' floreria-db",
          {
            ...options,
            verbose: false, // Don't spam output with health checks
          }
        );
        console.log(chalk.green("✅ Database is ready!"));
        clearInterval(checkDbHealth);
        resolve(true);
      } catch (e) {
        console.log(chalk.yellow("⏱️ Database not ready yet. Waiting..."));
      }
    }, 2000);
  });

  console.log(chalk.blue("\n🔒 Running Medusa DB migrations..."));
  await runCommand("pnpm medusa db:migrate", { ...options, cwd: STORE_DIR });

  console.log(chalk.blue("🌱 Seeding Medusa database (initial info)..."));
  await runCommand("pnpm seed", { ...options, cwd: STORE_DIR });

  console.log(chalk.blue("👤 Creating admin user..."));
  await runCommand(
    `pnpm medusa user -e "${MEDUSA_EMAIL}" -p "${MEDUSA_PASSWORD}"`,
    { ...options, cwd: STORE_DIR }
  );

  if (options.runDev) {
    console.log(
      chalk.green("\nStarting development servers from monorepo root...")
    );
    await runCommand("pnpm dev", { ...options, cwd: MONOREPO_ROOT });
  } else {
    console.log(
      chalk.green(
        "\n✅ Setup complete. Use '--run-dev' to start development mode."
      )
    );
    process.exit(0);
  }
}

/**
 * Runs only database migrations.
 */
export async function runDatabaseMigrations(
  options: CommandOptions
): Promise<void> {
  console.log(chalk.blue("\n🔒 Running Better Auth migrations..."));
  await runCommand("pnpm db:migrate", { ...options, cwd: WWW_DIR });

  console.log(chalk.blue("🔒 Running Medusa DB migrations..."));
  await runCommand("pnpm medusa db:migrate", { ...options, cwd: STORE_DIR });

  console.log(chalk.green("\n✅ All database migrations complete."));
}

/**
 * Deletes all data from the database.
 */
export async function deleteDatabaseData(
  options: CommandOptions
): Promise<void> {
  console.log(
    chalk.yellow("\n⚠️  This will DELETE ALL DATA from your database.")
  );
  const confirm = await inquirer.prompt({
    type: "confirm",
    name: "continue",
    message: chalk.red("Are you absolutely sure you want to delete all data?"),
    default: false,
  });

  if (!confirm.continue) {
    console.log(chalk.red("❌ Aborted by user."));
    process.exit(0);
  }

  console.log(
    chalk.blue("🗑️ Deleting all data (dropping database containers)...")
  );
  // This command effectively resets the database by removing volumes
  await runCommand("docker compose down -v", {
    ...options,
    cwd: MONOREPO_ROOT,
  });
  console.log(chalk.green("✅ All database data deleted."));
}

/**
 * Adds a new product via CLI input.
 * This is a placeholder; you'll need to implement the actual Medusa API call or CLI command.
 */
export async function addNewProduct(options: CommandOptions): Promise<void> {
  console.log(chalk.blue("\n✨ Let's add a new product!"));

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "title",
      message: chalk.green("Product Title:"),
      validate: (input) =>
        input.trim() !== "" ? true : "Title cannot be empty!",
    },
    {
      type: "number",
      name: "price",
      message: chalk.green("Product Price (in cents, e.g., 1000 for $10.00):"),
      validate: (input) =>
        input && input > 0 ? true : "Price must be a positive number!",
      filter: Number, // Ensure the input is treated as a number
    },
    {
      type: "input",
      name: "description",
      message: chalk.green("Product Description (optional):"),
    },
  ]);

  const { title, price, description } = answers;

  console.log(chalk.magenta("\nAttempting to add product with details:"));
  console.log(`  Title: ${chalk.bold(title)}`);
  console.log(`  Price: ${chalk.bold(`$${(price / 100).toFixed(2)}`)}`);
  if (description) {
    console.log(`  Description: ${chalk.italic(description)}`);
  }

  // --- REPLACE THIS WITH YOUR ACTUAL MEDUSA COMMAND OR API CALL ---
  // Example: If Medusa has a CLI command for adding products:
  // await runCommand(`pnpm medusa product create --title "${title}" --price ${price} --description "${description}"`, { ...options, cwd: STORE_DIR });

  // For now, just simulate success:
  console.log(
    chalk.yellow("\nNote: Product addition logic is currently simulated.")
  );
  console.log(chalk.green("✅ Product added (simulated successfully)!"));

  // If you were to make an actual HTTP request, you'd use a library like `axios`
  // For Medusa, you might interact with its Admin API or a specific Medusa CLI command.
}
