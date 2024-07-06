module.exports = async (id, bot) => {
    let data = { shardID: id };
    const cmds = bot.cmd.shardReconnecting.values();
    for (const cmd of cmds) {
        await require("../function.js")(cmd.code, "shardReconnecting", bot.db, data, bot.client, bot);
    }
}
