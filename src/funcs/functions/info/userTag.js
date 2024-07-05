module.exports = {
  name: "$userTag",
  usage: "[userID (optional)]",
  description: "return user tag with provided id",
  code: async (d) => {
    let [id = d.author?.id] = d.data.splits;
    let user = id === d.author?.id ? d.author : await d.client.users.fetch(id).catch(() => null);

    if (!user) return d.sendError(d, "Invalid user id");
    return user.tag;
  }
};
