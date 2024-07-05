module.exports = {
  name: "$authorBannerColor",
  usage: "",
  description: "display author banner color\nreturn color of author banner",
  code: async (d) => {
    try {
      const user = await d.client.users.fetch(d.author.id, { force: true });
      const bannerColor = user.bannerColor ? user.bannerColor.toString() : 'No banner color';
      return bannerColor;
    } catch (error) {
      console.error('Error fetching user banner color:', error);
      return 'Error fetching banner color';
    }
  }
};
