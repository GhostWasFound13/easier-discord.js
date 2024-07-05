module.exports = {
  name: "$authorAvatar",
  usage: "[size(optional);dynamic(optional);format(optional)]",
  description: "display author avatar\nreturn link of author avatar",
  code: async (d) => {
    const [size = 4096, dynamic = "yes", format = "webp"] = d.data.splits;

    // Ensure the format is one of the valid formats supported by Discord.js v14
    const validFormats = ['webp', 'png', 'jpg', 'jpeg', 'gif'];
    if (!validFormats.includes(format)) {
      format = 'webp';
    }

    return d.author?.displayAvatarURL({
      size: Number(size),
      dynamic: dynamic === 'yes',
      extension: format
    });
  }
};
