#!/usr/bin/env node
import { runSetup } from "./setup.js";
import { runUninstall } from "./uninstall.js";

const command = process.argv[2];

switch (command) {
  case "setup": {
    const result = runSetup(process.cwd());
    console.log(result.message);
    break;
  }
  case "uninstall": {
    const result = runUninstall(process.cwd(), true);
    console.log(result.message);
    break;
  }
  default:
    console.log("Usage: hotmarks <setup|uninstall>");
    console.log("  setup     - Create .hotmarks config in current directory");
    console.log("  uninstall - Remove .hotmarks config");
    process.exit(1);
}
