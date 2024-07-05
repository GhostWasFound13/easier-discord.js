module.exports = {
  name: "$userExist",
  usage: "[userID]",
  description: "checks if a user exists",
  code: async (d) => {
    let [id] = d.data.splits;
    let user = await d.client.users.fetch(id).catch(() => null);
    return user ? "true" : "false";
  }
};
