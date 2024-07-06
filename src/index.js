const api = require("./handler/api.js");
const version = require("../package.json").version;
const { Client, GatewayIntentBits, Partials, ActivityType } = require("discord.js");
const newMap = require("./cache Handler/cache.js");
const Db = require("meatdb");
const fs = require("fs");
const path = require("path");

class Bot {
    constructor(opt) {
        this.opt = opt;
        this.prefix = opt.prefix;
        this.db = new Db({
            path: opt?.database?.path,
        });
        this.cmd = require("./handler/commandType.js");
        this.funcParser = require("./funcs/parser");
        this.functions = new newMap();
        this.variable = new newMap();
        this.status = new newMap();
        this.#start();

        if (typeof this.prefix !== "string") throw new Error("prefix must be a string");
    }

    // Start client
    #start() {
        const client = new Client({
            intents: this.opt.intents.map(intent => GatewayIntentBits[intent]),
            partials: this.opt.partials.map(partial => Partials[partial]),
        });
        this.client = client;
        this.client.simpler = this;

        // Load functions
        const dirFolder = path.join(__dirname, "funcs", "functions");
        const folders = fs.readdirSync(dirFolder);
        folders.forEach(x => {
            const files = fs.readdirSync(path.join(dirFolder, x)).filter(file => file.endsWith('js'));
            files.forEach(y => {
                const file = require(path.join(dirFolder, x, y));
                this.functions.set("$" + y.replace(".js", "").toLowerCase(), file.code);
            });
        });

        // Presence manager
        this.client.on('ready', async () => {
            while (this.status.size > 0) {
                for (let [k, v] of this.status) {
                    this.client.user.setPresence({
                        activities: [{
                            name: v.text,
                            type: ActivityType[v.type.toUpperCase()],
                        }],
                        status: v.status,
                    });
                    await new Promise(resolve => setTimeout(resolve, v.time));
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
            await require("./handler/command/botJoin.js")(guild, this);
        });
    }

    onBotLeave() {
        this.client.on("guildDelete", async (guild) => {
            await require("./handler/command/botLeave.js")(guild, this);
        });
    }

    onMessage() {
        this.client.on("messageCreate", async (msg) => {
            await require("./handler/command/default.js")(msg, this);
            await require("./handler/command/always.js")(msg, this);
        });
    }

    onMemberJoin() {
        this.client.on("guildMemberAdd", async (member) => {
            await require("./handler/command/memberJoin.js")(member, this);
        });
    }

    onMemberLeave() {
        this.client.on("guildMemberRemove", async (member) => {
            await require("./handler/command/memberLeave.js")(member, this);
        });
    }

    onReactionAdd() {
        this.client.on("messageReactionAdd", async (reaction, user) => {
            await require("./handler/command/reactionAdd.js")(reaction, user, this);
        });
    }

    // Shard events
    onShardReady() {
        this.client.on('shardReady', async (id, guilds) => {
            await require("./handler/command/shardReady.js")(id, this);
        });
    }

    onShardDisconnect() {
        this.client.on('shardDisconnect', async (event, id) => {
            await require("./handler/command/shardDisconnect.js")(event, id, this);
        });
    }

    onShardReconnecting() {
        this.client.on('shardReconnecting', async (id) => {
            await require("./handler/command/shardReconnecting.js")(id, this);
        });
    }

    // Commands
    botJoinCommand(opt) {
        this.cmd.botJoin.set(this.cmd.botJoin.size, opt);
    }

    botLeaveCommand(opt) {
        this.cmd.botLeave.set(this.cmd.botLeave.size, opt);
    }

    command(...opts) {
        for (const opt of opts) {
            if (opt?.name !== "$always") {
                this.cmd["default"].set(opt.name.toLowerCase(), opt);
            } else {
                this.cmd["alwaysExecute"].set(this.cmd.alwaysExecute.size, opt);
            }
        }
    }

    executableCommand(opt) {
        this.cmd.executable.set(opt.name.toLowerCase(), opt);
    }

    intervalCommand(opt) {
        (async () => {
            const commandData = opt.channel?.includes("$") ? await require("./handler/function.js")(opt.channel, "channel", this.db, {}, this.client, this) : opt.channel || {};
            setInterval(async () => {
                await require("./handler/function.js")(opt.code, "intervalCommand", this.db, commandData, this.client, this);
            }, opt.every);
            if (opt?.onStartup === true) {
                this.client.on('ready', async () => {
                    await require("./handler/function.js")(opt.code, "intervalCommand", this.db, commandData, this.client, this);
                });
            }
        })();
    }

    memberJoinCommand(opt) {
        this.cmd.memberJoin.set(this.cmd.memberJoin.size, opt);
    }

    memberLeaveCommand(opt) {
        this.cmd.memberLeave.set(this.cmd.memberLeave.size, opt);
    }

    reactionAddCommand(opt) {
        this.cmd.reactionAdd.set(this.cmd.reactionAdd.size, opt);
    }

    ready(opt) {
        this.client.on("ready", async () => {
            await require("./handler/function.js")(opt.code, undefined, this.db, {}, this.client, this);
        });
    }

    variables(opt) {
        for (const [name, value] of Object.entries(opt)) {
            this.variable.set(name, value);
        }
    }

    async login(token) {
        await this.client.login(token);
        this.client.prefix = this.prefix;
        console.log(`Initialized on ${this.client.user.tag}\nMade with: discord.js v14\nv${version}\nJoin official support server: https://discord.gg/DW4CCH236j`);
        api(this);
    }

    // Custom Function
    createCustomFunction(opt) {
        if (!opt?.name || !opt?.name?.includes('$') || typeof opt?.code !== 'function') throw new Error('Invalid Name or Code');
        this.functions.set(opt.name.toLowerCase(), opt.code);
    }

    // Add presence
    addPresence(...options) {
        if (!options) throw new Error('Invalid presence options provided!');
        options.forEach(s => {
            if (s.time < 12000) throw new Error('Status time must be at least 12 seconds!');
            this.status.set(s.text, s);
        });
    }
}

class CommandHandler {
    constructor(opts) {
        this.bot = opts.client || opts.bot;
    }

    load(folder) {
        const bot = this.bot;
        const consoleText = [];
        const dirFolder = path.join(process.cwd(), folder);

        const files = fs.readdirSync(dirFolder).filter(file => file.endsWith('js'));
        files.forEach(x => {
            try {
                const theFile = require(`${dirFolder}/${x}`);
                const theCmd = bot.cmd[theFile?.type || "default"];
                if (theCmd !== undefined) {
                    theCmd.set(theFile.name, theFile);
                    consoleText.push('Loaded ' + dirFolder + '/' + x);
                } else {
                    consoleText.push("Command type is invalid " + dirFolder + "/" + x);
                }
            } catch (e) {
                consoleText.push('Failed to load ' + dirFolder + '/' + x);
            }
        });
        console.log(consoleText.join('\n|-------------------------------|\n'));
    }
}

module.exports = {
    Bot,
    CommandHandler
};
