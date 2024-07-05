module.exports = async (event, id, bot) => {
    let data = { shardID: id, event };
    const cmds = bot.cmd.shardDisconnect.values();
    for (const cmd of cmds) {
        await require("../function.js")(cmd.code, "shardDisconnect", bot.db, data, bot.client, bot);
    }
}
