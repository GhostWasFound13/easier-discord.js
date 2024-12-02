import { Client, GatewayIntentBits, Partials, ActivityType, ClientOptions, PresenceData } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import Db from "meatdb";
import api from "./handler/api";
import { version } from "../package.json";
import newMap from "./cache Handler/cache";

type CommandOptions = Record<string, unknown>;
type PresenceOptions = {
  text: string;
  type: keyof typeof ActivityType;
  status: PresenceData["status"];
  time: number;
};

interface BotOptions {
  prefix: string;
  intents: (keyof typeof GatewayIntentBits)[];
  partials: (keyof typeof Partials)[];
  database?: {
    path: string;
  };
}

class Bot {
  public client!: Client;
  public prefix: string;
  public db: Db;
  public cmd: Record<string, Map<string | number, unknown>>;
  public functions: Map<string, Function>;
  public variable: Map<string, unknown>;
  public status: Map<string, PresenceOptions>;
  private opt: BotOptions;

  constructor(opt: BotOptions) {
    this.opt = opt;
    this.prefix = opt.prefix;
    this.db = new Db({
      path: opt.database?.path || "",
    });
    this.cmd = {
      botJoin: new Map(),
      botLeave: new Map(),
      default: new Map(),
      alwaysExecute: new Map(),
      executable: new Map(),
      intervalCommand: new Map(),
      memberJoin: new Map(),
      memberLeave: new Map(),
      reactionAdd: new Map(),
    };
    this.functions = new newMap();
    this.variable = new newMap();
    this.status = new newMap();

    if (typeof this.prefix !== "string") {
      throw new Error("Prefix must be a string.");
    }

    this.#start();
  }

  // Start client
  #start() {
    const clientOptions: ClientOptions = {
      intents: this.opt.intents.map((intent) => GatewayIntentBits[intent]),
      partials: this.opt.partials.map((partial) => Partials[partial]),
    };

    this.client = new Client(clientOptions);
    this.client.simpler = this;

    // Load functions
    const dirFolder = join(__dirname, "funcs", "functions");
    const folders = readdirSync(dirFolder);
    folders.forEach((folder) => {
      const files = readdirSync(join(dirFolder, folder)).filter((file) =>
        file.endsWith(".js")
      );
      files.forEach((file) => {
        const func = require(join(dirFolder, folder, file));
        this.functions.set("$" + file.replace(".js", "").toLowerCase(), func.code);
      });
    });

    // Presence manager
    this.client.on("ready", async () => {
      while (this.status.size > 0) {
        for (const [, v] of this.status) {
          this.client.user?.setPresence({
            activities: [
              {
                name: v.text,
                type: ActivityType[v.type.toUpperCase()],
              },
            ],
            status: v.status,
          });
          await new Promise((resolve) => setTimeout(resolve, v.time));
        }
      }
    });

    // Shard events
    this.onShardReady();
    this.onShardDisconnect();
    this.onShardReconnecting();
  }

  // Events
  onBotJoin() {
    this.client.on("guildCreate", async (guild) => {
      await require("./handler/command/botJoin")(guild, this);
    });
  }

  onBotLeave() {
    this.client.on("guildDelete", async (guild) => {
      await require("./handler/command/botLeave")(guild, this);
    });
  }

  onMessage() {
    this.client.on("messageCreate", async (msg) => {
      await require("./handler/command/default")(msg, this);
      await require("./handler/command/always")(msg, this);
    });
  }

  onMemberJoin() {
    this.client.on("guildMemberAdd", async (member) => {
      await require("./handler/command/memberJoin")(member, this);
    });
  }

  onMemberLeave() {
    this.client.on("guildMemberRemove", async (member) => {
      await require("./handler/command/memberLeave")(member, this);
    });
  }

  onReactionAdd() {
    this.client.on("messageReactionAdd", async (reaction, user) => {
      await require("./handler/command/reactionAdd")(reaction, user, this);
    });
  }

  // Shard events
  onShardReady() {
    this.client.on("shardReady", async (id) => {
      await require("./handler/command/shardReady")(id, this);
    });
  }

  onShardDisconnect() {
    this.client.on("shardDisconnect", async (event, id) => {
      await require("./handler/command/shardDisconnect")(event, id, this);
    });
  }

  onShardReconnecting() {
    this.client.on("shardReconnecting", async (id) => {
      await require("./handler/command/shardReconnecting")(id, this);
    });
  }

  // Commands
  botJoinCommand(opt: CommandOptions) {
    this.cmd.botJoin.set(this.cmd.botJoin.size, opt);
  }

  botLeaveCommand(opt: CommandOptions) {
    this.cmd.botLeave.set(this.cmd.botLeave.size, opt);
  }

  command(...opts: CommandOptions[]) {
    for (const opt of opts) {
      if (opt.name !== "$always") {
        this.cmd.default.set(opt.name.toLowerCase(), opt);
      } else {
        this.cmd.alwaysExecute.set(this.cmd.alwaysExecute.size, opt);
      }
    }
  }

  executableCommand(opt: CommandOptions) {
    this.cmd.executable.set(opt.name.toLowerCase(), opt);
  }

  intervalCommand(opt: CommandOptions & { every: number; onStartup?: boolean }) {
    const executeInterval = async () => {
      const commandData = opt.channel?.includes("$")
        ? await require("./handler/function")(opt.channel, "channel", this.db, {}, this.client, this)
        : opt.channel || {};
      setInterval(async () => {
        await require("./handler/function")(opt.code, "intervalCommand", this.db, commandData, this.client, this);
      }, opt.every);
      if (opt?.onStartup) {
        this.client.on("ready", async () => {
          await require("./handler/function")(opt.code, "intervalCommand", this.db, commandData, this.client, this);
        });
      }
    };
    executeInterval();
  }

  memberJoinCommand(opt: CommandOptions) {
    this.cmd.memberJoin.set(this.cmd.memberJoin.size, opt);
  }

  memberLeaveCommand(opt: CommandOptions) {
    this.cmd.memberLeave.set(this.cmd.memberLeave.size, opt);
  }

  reactionAddCommand(opt: CommandOptions) {
    this.cmd.reactionAdd.set(this.cmd.reactionAdd.size, opt);
  }

  ready(opt: CommandOptions) {
    this.client.on("ready", async () => {
      await require("./handler/function")(opt.code, undefined, this.db, {}, this.client, this);
    });
  }

  variables(opt: Record<string, unknown>) {
    for (const [name, value] of Object.entries(opt)) {
      this.variable.set(name, value);
    }
  }

  async login(token: string) {
    await this.client.login(token);
    this.client.prefix = this.prefix;
    console.log(
      `Initialized on ${this.client.user?.tag}\nMade with: discord.js v14\nv${version}\nJoin official support server: https://discord.gg/DW4CCH236j`
    );
    api(this);
  }

  // Custom Function
  createCustomFunction(opt: { name: string; code: Function }) {
    if (!opt?.name?.includes("$") || typeof opt?.code !== "function") {
      throw new Error("Invalid Name or Code");
    }
    this.functions.set(opt.name.toLowerCase(), opt.code);
  }

  // Add presence
  addPresence(...options: PresenceOptions[]) {
    if (!options) throw new Error("Invalid presence options provided!");
    options.forEach((s) => {
      if (s.time < 12000) throw new Error("Status time must be at least 12 seconds!");
      this.status.set(s.text, s);
    });
  }
}

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

export { Bot, CommandHandler };
