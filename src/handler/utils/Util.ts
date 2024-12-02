import {
  Client,
  Guild,
  GuildMember,
  Message,
  TextBasedChannel,
  User,
  Channel,
  AnyThreadChannel,
  GuildTextBasedChannel,
} from "discord.js";

export class Util {
  static checkCondition(condition: string): boolean {
    let cond = condition.replaceAll("&&", "#__AND__#")
                        .replaceAll("||", "#__OR__#")
                        .replaceAll('"', '\\"');

    cond = '"' + cond + '"'
              .replaceAll("==", '"=="')
              .replaceAll("!=", '"!="')
              .replaceAll(">", '">"')
              .replaceAll("<", '"<"')
              .replaceAll(">=", '">="')
              .replaceAll("<=", '"<="')
              .replaceAll("#__AND__#", '"&&"')
              .replaceAll("#__OR__#", '"||"');

    const condArray = cond.split('"');
    condArray.forEach((z) => {
      if (z === "") return;
      if (!isNaN(Number(z))) {
        cond = cond.replace(`"${z}"`, z);
      }
      if (z === "true" || z === "false") {
        cond = cond.replace(`"${z}"`, z);
      }
    });

    const result = eval(cond);
    return result === true || result === false ? result : false;
  }

  static embedParser(message: string): { content: string; embeds: any[] } {
    let content = message;
    const embeds: any[] = [];

    if (message?.includes("{createEmbed:")) {
      const raw = message.split("{createEmbed:").slice(1);

      for (const sp of raw) {
        const embed: any = { fields: [] };
        const insides = sp.slice(0, sp.lastIndexOf("}"));

        if (this.check(insides, "title")) {
          const title = this.inside(insides, "title").split(":");
          embed.title = title[0]?.unescape();
          if (title[1] !== undefined) embed.url = title.slice(1).join(":")?.unescape();
        }

        if (this.check(insides, "description")) {
          embed.description = this.inside(insides, "description")?.unescape();
        }

        if (this.check(insides, "color")) {
          embed.color = this.inside(insides, "color")?.unescape();
        }

        if (this.check(insides, "thumbnail")) {
          embed.thumbnail = { url: this.inside(insides, "thumbnail")?.unescape() };
        }

        if (this.check(insides, "author")) {
          embed.author = {};
          const inside = this.inside(insides, "author").split(":");
          embed.author.name = inside[0]?.unescape();
          const inside1 = inside.slice(1).join(":");
          if (inside1 !== undefined) embed.author.icon_url = inside1?.unescape();
        }

        if (this.check(insides, "authorUrl")) {
          if (embed.author) {
            embed.author.url = this.inside(insides, "authorUrl")?.unescape();
          }
        }

        if (this.check(insides, "field")) {
          const ins = insides.split("{field:").slice(1);
          for (const uh of ins) {
            const insideField = uh.split("}")[0];
            const inside = insideField.split(":");
            embed.fields.push({
              name: inside[0]?.unescape(),
              value: inside[1]?.unescape(),
              inline: inside[2] ? inside[2] === "yes" : false,
            });
          }
        }

        if (this.check(insides, "image")) {
          embed.image = { url: this.inside(insides, "image")?.unescape() };
        }

        if (this.check(insides, "footer")) {
          const inside = this.inside(insides, "footer").split(":");
          embed.footer = { text: inside[0]?.unescape() };
          if (inside[1] !== undefined) embed.footer.icon_url = inside.slice(1)?.unescape();
        }

        if (this.check(insides, "addTimestamp")) {
          const ins = this.inside(insides, "addTimestamp");
          embed.timestamp = ins.trim() === "" ? Date.now() : Number(ins);
        }

        embeds.push(embed);
        content = content.replace("{createEmbed:" + insides + "}", "");
      }

      return {
        content: content === "" ? " " : content?.unescape(),
        embeds,
      };
    } else {
      return { content: message?.unescape() || " ", embeds };
    }
  }

  private static check(sp: string, text: string): boolean {
    return sp.includes(`{${text}:`);
  }

  private static inside(sp: string, text: string): string {
    return sp.split(`{${text}:`)[1].split("}")[0];
  }

  static get channelTypes(): Record<string, string> {
    return {
      Dm: "DM",
      Text: "GUILD_TEXT",
      Voice: "GUILD_VOICE",
      News: "GUILD_NEWS",
      Store: "GUILD_STORE",
      Unknown: "UNKNOWN",
      GroupDm: "GROUP_DM",
      Stage: "GUILD_STAGE_VOICE",
      Category: "GUILD_CATEGORY",
      NewsThread: "GUILD_NEWS_THREAD",
      PublicThread: "GUILD_PUBLIC_THREAD",
      PrivateThread: "GUILD_PRIVATE_THREAD",
    };
  }

  static async fetchMember(guild: Guild, id: string): Promise<GuildMember | undefined> {
    return guild.members.fetch(id).catch(() => undefined);
  }

  static async getMember(guild: Guild, id: string): Promise<GuildMember | undefined> {
    let member = guild.members.cache.get(id);
    if (!member) member = await this.fetchMember(guild, id);
    return member;
  }

  static async fetchUser(client: Client, userId: string): Promise<User | undefined> {
    return client.users.fetch(userId).catch(() => undefined);
  }

  static async getUser(client: Client, userId: string): Promise<User | undefined> {
    let user = client.users.cache.get(userId);
    if (!user) user = await this.fetchUser(client, userId);
    return user;
  }

  static async fetchChannel(client: Client, id: string): Promise<Channel | null> {
    return client.channels.fetch(id).catch(() => null);
  }

  static async getChannel(client: Client, id: string): Promise<Channel | null> {
    let channel = client.channels.cache.get(id);
    if (!channel) channel = await this.fetchChannel(client, id);
    return channel;
  }

  static async fetchGuild(client: Client, id: string): Promise<Guild | undefined> {
    return client.guilds.fetch(id).catch(() => undefined);
  }

  static async getGuild(client: Client, id: string): Promise<Guild | undefined> {
    let guild = client.guilds.cache.get(id);
    if (!guild) guild = await this.fetchGuild(client, id);
    return guild;
  }
}
