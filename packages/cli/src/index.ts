import chalk from "chalk";
import { program } from "commander";
import inquirer from "inquirer";
import {
  addNewProduct,
  deleteDatabaseData,
  runDatabaseMigrations,
  runEntireSetup,
} from "./commands";
import { type CommandOptions, loadEnv } from "./utils";

// Load environment variables early
loadEnv();

program
  .name("my-dev-cli")
  .description("Internal development CLI for Medusa monorepo tasks")
  .version("1.0.0");

// Global options
program.option("-v, --verbose", "Enable verbose output for commands", false);

// Base command logic (if no subcommand is specified)
program.action(async (options: CommandOptions) => {
  // If no specific command is passed, show the interactive menu
  if (program.args.length === 0) {
    console.log(chalk.bold.yellow("\nWelcome to the Medusa Dev CLI!"));

    const { action } = await inquirer.prompt({
      type: "list",
      name: "action",
      message: chalk.blue("What would you like to do?"),
      choices: [
        {
          name: "✨ Run full project setup (clean DB, migrate, seed, admin user)",
          value: "fullSetup",
        },
        { name: "🔒 Run database migrations only", value: "runMigrations" },
        { name: "🗑️ Delete all database data", value: "deleteData" },
        { name: "📦 Add a new product via CLI", value: "addNewProduct" },
        { name: "Exit", value: "exit" },
      ],
    });

    switch (action) {
      case "fullSetup":
        await runEntireSetup({ ...options, runDev: false }); // runDev default to false, can be overridden by explicit command
        break;
      case "runMigrations":
        await runDatabaseMigrations(options);
        break;
      case "deleteData":
        await deleteDatabaseData(options);
        break;
      case "addNewProduct":
        await addNewProduct(options);
        break;
      case "exit":
        console.log(chalk.gray("Exiting CLI."));
        process.exit(0);
    }
  }
});

// Define subcommands
program
  .command("full-setup")
  .description(
    "Runs the entire project setup (drops DB, migrates, seeds, creates admin)."
  )
  .option("-d, --run-dev", "Starts development servers after setup", false)
  .action(async (cmdOptions) => {
    const globalOptions = program.opts<CommandOptions>();
    await runEntireSetup({ ...globalOptions, runDev: cmdOptions.runDev });
  });

program
  .command("db:migrate")
  .description("Runs only the database migrations for all services.")
  .action(async () => {
    const globalOptions = program.opts<CommandOptions>();
    await runDatabaseMigrations(globalOptions);
  });

program
  .command("db:reset")
  .description(
    "Deletes all data from the database (drops volumes and containers)."
  )
  .action(async () => {
    const globalOptions = program.opts<CommandOptions>();
    await deleteDatabaseData(globalOptions);
  });

program
  .command("product:add")
  .description("Interactively adds a new product (placeholder).")
  .action(async () => {
    const globalOptions = program.opts<CommandOptions>();
    await addNewProduct(globalOptions);
  });

program.parse(process.argv);

// If no command was given and no arguments were passed (and the program didn't
// default to the interactive menu via `program.action`), show help.
if (process.argv.slice(2).length === 0 && !program.processedArgs) {
  program.outputHelp();
}
