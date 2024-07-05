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
        this.client = {};
        this.prefix = opt.prefix;
        this.db = new Db({
            path: opt?.database?.path,
        });
        this.cmd = require("./handler/commandType.js");
        this.funcParser = require("./funcs/parser");
        this.functions = new newMap();
        this.variable = new newMap();
        this.#start();
        if (typeof this.prefix !== "string") throw new Error("prefix must be string");
    }

    //start client
    #start() {
        const client = new Client({
            intents: new IntentsBitField(this.opt.intents).toArray(),
            partials: this.opt.partials.map(p => Partials[p]),
        });
        this.client = client;
        this.client.simpler = this;
        let dirFolder = path.join(__dirname, "funcs", "functions");

        let folders = fs.readdirSync(dirFolder);
        folders.forEach(x => {
            let files = fs.readdirSync(path.join(dirFolder, x)).filter(file => file.endsWith('js'));
            files.forEach(y => {
                const file = require(`${path.join(dirFolder, x, y)}`);
                this.functions.set("$" + y.replace(".js", "").toLowerCase(), file.code);
            });
        });

        // Presence manager
        this.client.on('ready', async () => {
            while (this.status.size > 0) {
                for (let [k, v] of this.status) {
                    const session = this.client;
                    session.user.setPresence({
                        activities: [{
                            name: v.text,
                            type: ActivityType[v.type.toUpperCase()],
                        }],
                        status: v.status,
                    });
                    await sleep(ms(v.time));
                }
            }
        });
    }

    //events
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

    //commands
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
        console.log("Initialized on " + this.client.user.tag + "\nMade with : Simple Discord\nv" + version + "\nJoin official support server: https://discord.gg/DW4CCH236j");
        api(this);
    }

    //Custom Function
    createCustomFunction(opt) {
        if (!opt?.name || !opt?.name?.includes('$') || typeof opt?.code !== 'function') throw new Error('Invalid Name or Code');
        this.functions.set(opt.name.toLowerCase(), opt.code);
    }

    // Add presence
    addPresence(...options) {
        if (!options) throw new Error('Invalid presence options provided!');
        options.map(s => {
            if (ms(s.time) < 12000) throw new Error('Status time must be at least 12 seconds!');
            this.status.set(s.text, s);
        });
    }
}

class CommandHandler {
    constructor(opts) {
        this.bot = opts.client || opts.bot;
    }
    load(folder) {
        let bot = this.bot;
        let consoleText = [];
        let dirFolder = path.join(process.cwd(), folder);

        let files = fs.readdirSync(dirFolder).filter(file => file.endsWith('js'));
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
