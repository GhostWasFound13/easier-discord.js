module.exports = async (id, bot) => {
  let data = { shardID: id };
  const cmds = bot.cmd.shardReconnecting.values();
  for (const cmd of cmds) {
    if (cmd?.channel?.includes("$")) {
      data.channel = bot.client.channels.cache.get(
        await require("../function.js")(cmd.channel, "channeleval", bot.db, data, bot.client, bot)
      );
    } else {
      data.channel = bot.client.channels.cache.get(cmd.channel);
    }
    require("../function.js")(cmd.code, "shardReconnecting", bot.db, data, bot.client, bot);
  }
};
