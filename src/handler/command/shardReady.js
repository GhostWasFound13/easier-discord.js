module.exports = async (id, guilds, bot) => {
  if (!bot || !bot.cmd || !bot.cmd.shardReady) {
    return
  }
  const data = { shardID: id, guilds };
  const cmds = bot.cmd.shardReady.values();

  for (const cmd of cmds) {
    if (cmd?.channel?.includes("$")) {
      data.channel = bot.client.channels.cache.get(
        await require("../function.js")(cmd.channel, "channeleval", bot.db, data, bot.client, bot)
      );
    } else {
      data.channel = bot.client.channels.cache.get(cmd?.channel);
    }

    require("../function.js")(cmd.code, "shardReady", bot.db, data, bot.client, bot);
  }
};
