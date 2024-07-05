module.exports = {
  name: "$userPerms",
  usage: "[userID;guildID(optional)]",
  description: "return user permissions in a guild",
  code: async (d) => {
    let [userID, guildID = d.guild?.id] = d.data.splits;
    let guild = d.client.guilds.cache.get(guildID);
    if (!guild) return d.sendError(d, "Invalid guild ID");

    let member = await guild.members.fetch(userID).catch(() => null);
    if (!member) return d.sendError(d, "Invalid user ID");

    return member.permissions.toArray().join(", ");
  }
};
