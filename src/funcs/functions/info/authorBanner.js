module.exports = {
  name: "$authorBannerColor",
  usage: "",
  description: "display author banner color\nreturn color of author banner",
  code: async (d) => {
    const user = await d.client.users.fetch(d.author.id, { force: true });
    const bannerColor = user.bannerColor ? user.bannerColor.toString() : 'No banner color';
    return bannerColor;
  }
};
