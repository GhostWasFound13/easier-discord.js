module.exports = async (id, bot) => {
    let data = { shardID: id };
    const cmds = bot.cmd.shardReady.values();
    for (const cmd of cmds) {
        await require("../function.js")(cmd.code, "shardReady", bot.db, data, bot.client, bot);
    }
}
