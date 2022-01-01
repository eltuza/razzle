import yargs, { Argv } from "yargs";
import { hideBin } from "yargs/helpers";

import loadConfig from "./loaders/config.js";
import { Plugin, Config } from "./types";

type Context = Parameters<Required<Plugin>['modifyContext']>[1]

export async function cli(): Promise<void>;
export async function cli() {
  const { razzleContext } = await loadConfig();

  type PluginParser = (
    argv: Argv,
    pluginOptions: Record<string, unknown>,
    razzleContext: Context
  ) => void;
  type ConfigParser = (
    argv: Argv,
    razzleContext: Context
  ) => void;

  const parsers: Record<
    string,
    {
      options?: Record<string, unknown>;
      parser: PluginParser | ConfigParser;
    }
  > = {};
  for (const { plugin, options: chilPluginOptios } of razzleContext.plugins) {
    // Check if plugin.addCommands is a object.
    // If it is, add all keys as a function to parsers.
    if ((<Plugin>plugin).addCommands) {
      for (const command in (<Plugin>plugin).addCommands) {
        parsers[command] = {
          options: chilPluginOptios,
          parser: (<Required<Plugin>>plugin).addCommands[command],
        };
      }
    }
  }

  let argv = yargs(hideBin(process.argv))
    .scriptName("razzle")
    .option("d", {
      type: "boolean",
      alias: "debug",
      describe: "enable debug option",
    })
    .option("v", {
      type: "boolean",
      alias: "verbose",
      describe: "enable debug option",
    })

  for (const command in parsers) {
    if (parsers[command].options) {
      (<PluginParser>parsers[command].parser)(
        argv,
        <Record<string, unknown>>parsers[command].options,
        razzleContext
      );
    } else {
      (<ConfigParser>parsers[command].parser)(
        argv,
        razzleContext
      );
    }
  }
  argv.parse();
}
