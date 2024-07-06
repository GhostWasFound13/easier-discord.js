module.exports = {
  name: "$authorBannerColor",
  usage: "",
  description: "display author banner color\nreturn color of author banner",
  code: async (d) => {
    const user = await d.client.users.fetch(d.author.id, { force: true });
    if (!user.bannerColor) {
      return d.sendError(d, "No banner color");
    }
    return user.bannerColor.toString();
  }
};
