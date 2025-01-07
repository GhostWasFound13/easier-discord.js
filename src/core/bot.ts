import {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
  ClientOptions,
  PresenceData,
} from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import Db from "meatdb";
import api from "./handler/api";
import { version } from "../package.json";
import newMap from "./cache Handler/cache";
import { CommandHandler } from "./CommandHandler"; // Import CommandHandler here

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

  #start() {
    const clientOptions: ClientOptions = {
      intents: this.opt.intents.map((intent) => GatewayIntentBits[intent]),
      partials: this.opt.partials.map((partial) => Partials[partial]),
    };

    this.client = new Client(clientOptions);
    this.client.simpler = this;

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

    this.onShardReady();
    this.onShardDisconnect();
    this.onShardReconnecting();
  }

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

  addPresence(...options: PresenceOptions[]) {
    if (!options) throw new Error("Invalid presence options provided!");
    options.forEach((s) => {
      if (s.time < 12000) throw new Error("Status time must be at least 12 seconds!");
      this.status.set(s.text, s);
    });
  }
}

export { Bot };
