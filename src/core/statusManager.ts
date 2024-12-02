import { Bot } from './Bot';
import { ActivityType, PresenceData } from 'discord.js';

type PresenceOptions = {
  text: string;
  type: keyof typeof ActivityType;
  status: PresenceData['status'];
  time: number;
};

class StatusManager {
  private bot: Bot;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  addPresence(...options: PresenceOptions[]) {
    if (!options) throw new Error("Invalid presence options provided!");
    options.forEach((s) => {
      if (s.time < 12000) throw new Error("Status time must be at least 12 seconds!");
      this.bot.status.set(s.text, s);
    });
  }

  startPresenceCycle() {
    this.bot.client.on('ready', async () => {
      while (this.bot.status.size > 0) {
        for (const [, v] of this.bot.status) {
          this.bot.client.user?.setPresence({
            activities: [
              {
                name: v.text,
                type: ActivityType[v.type.toUpperCase()],
              },
            ],
            status: v.status,
          });
          await new Promise((resolve) => setTimeout(resolve, v.time));
        }
      }
    });
  }
}

export { StatusManager };
