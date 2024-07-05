module.exports = {
  name: "$authorBanner",
  usage: "[size(optional);dynamic(optional);format(optional)]",
  description: "display author banner\nreturn link of author banner",
  code: async (d) => {
    const [size = 4096, dynamic = "yes", format = "webp"] = d.data.splits;

    // Ensure the format is one of the valid formats supported by Discord.js v14
    const validFormats = ['webp', 'png', 'jpg', 'jpeg'];
    if (!validFormats.includes(format)) {
      format = 'webp';
    }

    try {
      const user = await d.client.users.fetch(d.author.id, { force: true });
      return user.bannerURL({
        size: Number(size),
        dynamic: dynamic === 'yes',
        extension: format
      }) || 'No banner';
    } catch (error) {
      console.error('Error fetching user banner:', error);
      return 'Error fetching banner';
    }
  }
};
