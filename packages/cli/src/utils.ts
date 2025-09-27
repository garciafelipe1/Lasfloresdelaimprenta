// packages/cli/src/utils.ts
import chalk from "chalk";
import { ChildProcess, exec } from "child_process";
import dotenv from "dotenv";
import ora from "ora";
import path from "path";

export interface CommandOptions {
  verbose: boolean;
  cwd?: string; // Current working directory for the command
}

/**
 * Executes a shell command with optional verbosity.
 * @param command The command string to execute.
 * @param options Command options (verbose, cwd).
 * @returns A promise that resolves if the command succeeds, rejects if it fails.
 */
export async function runCommand(
  command: string,
  options: CommandOptions
): Promise<void> {
  const { verbose, cwd } = options;
  const displayCommand = chalk.cyan(`$ ${command}`);
  const spinner = ora(displayCommand).start();

  try {
    await new Promise<void>((resolve, reject) => {
      const child: ChildProcess = exec(
        command,
        { cwd },
        (error, stdout, stderr) => {
          if (error) {
            spinner.fail(chalk.red(`Command failed: ${displayCommand}`));
            console.error(chalk.red(stdout)); // Show stdout on error for debugging
            console.error(chalk.red(stderr));
            return reject(error);
          }
          if (verbose) {
            spinner.succeed(
              chalk.green(`Command successful: ${displayCommand}`)
            );
            console.log(chalk.gray(stdout));
            if (stderr) console.error(chalk.yellow(stderr));
          } else {
            spinner.succeed(
              chalk.green(`Command successful: ${displayCommand}`)
            );
          }
          resolve();
        }
      );

      if (verbose) {
        // Stream output in verbose mode
        child.stdout?.on("data", (data) => process.stdout.write(data));
        child.stderr?.on("data", (data) => process.stderr.write(data));
      }
    });
  } catch (error) {
    spinner.fail(chalk.red(`Command failed: ${displayCommand}`));
    throw error; // Re-throw to be caught by the main program
  }
}

/**
 * Loads environment variables from the root .env file.
 */
export function loadEnv(envFileName = ".env", basePath?: string): void {
  let envPath: string;

  if (basePath) {
    envPath = path.resolve(basePath, envFileName);
  } else {
    // Default to monorepo root, assuming this is run from packages/cli/src
    envPath = path.resolve(process.cwd(), "../../", envFileName);
  }
  // Assuming .env is at the monorepo root
  // const envPath = path.resolve(process.cwd(), "../../.env");
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.warn(
      chalk.yellow(
        `Could not load .env file from ${envPath}. Make sure it exists.`
      )
    );
    // Continue without .env vars, as they might be set externally
  } else {
    console.log(chalk.gray(`Loaded environment variables from ${envPath}`));
  }
}

/**
 * Checks if required environment variables are set.
 * @param vars An array of variable names to check.
 */
export function checkRequiredEnv(vars: string[], envFilePath?: string): void {
  if (envFilePath) {
    loadEnv(path.basename(envFilePath), path.dirname(envFilePath));
  }

  const missing: string[] = [];
  for (const varName of vars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  if (missing.length > 0) {
    console.error(chalk.red(`\n❌ Missing required environment variables:`));
    missing.forEach((v) => console.error(chalk.red(`   - ${v}`)));
    console.error(
      chalk.red(
        `Please check your .env file at ${envFilePath ?? "the monorepo root"}`
      )
    );
    process.exit(1);
  }
}
