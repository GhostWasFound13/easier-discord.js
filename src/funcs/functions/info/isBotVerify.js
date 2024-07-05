module.exports = {
  name: "$isBotVerify",
  usage: "[userID]",
  description: "checks if the bot is verified",
  code: async (d) => {
    let [id = d.author?.id] = d.data.splits;
    let user = await d.client.users.fetch(id).catch(() => null);

    if (!user) return d.sendError(d, "Invalid user ID");
    return user.bot && user.flags.has('VERIFIED_BOT') ? "true" : "false";
  }
};
