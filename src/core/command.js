import { Bot } from './bot.ts';
import { readdirSync } from 'fs';
import { join } from 'path';

class CommandHandler {
  private bot: Bot;

  constructor(opts: { client?: Bot; bot?: Bot }) {
    this.bot = opts.client || opts.bot!;
  }

  load(folder: string) {
    const dirFolder = join(process.cwd(), folder);
    const consoleText: string[] = [];

    const files = readdirSync(dirFolder).filter((file) => file.endsWith(".js"));
    files.forEach((x) => {
      try {
        const theFile = require(`${dirFolder}/${x}`);
        const theCmd = this.bot.cmd[theFile?.type || "default"];
        if (theCmd) {
          theCmd.set(theFile.name, theFile);
          consoleText.push("Loaded " + dirFolder + "/" + x);
        } else {
          consoleText.push("Command type is invalid " + dirFolder + "/" + x);
        }
      } catch (e) {
        consoleText.push("Failed to load " + dirFolder + "/" + x);
      }
    });

    console.log(consoleText.join("\n|-------------------------------|\n"));
  }
}

export { CommandHandler };
