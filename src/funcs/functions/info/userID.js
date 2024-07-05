module.exports = {
  name: "$userID",
  usage: "[userTag]",
  description: "return user ID with provided tag",
  code: async (d) => {
    let [tag] = d.data.splits;
    let user = d.client.users.cache.find(user => user.tag === tag) || await d.client.users.fetch({ query: tag, limit: 1 }).then(users => users.first()).catch(() => null);

    if (!user) return d.sendError(d, "Invalid user tag");
    return user.id;
  }
};
