module.exports = {
name: "$userLeaderboard",
usage: "[varName;text(optional);list(optional);page(optional);guildId(optional)]",
description: "create leaderboard for users in the provided guild id\nAvailable keyword for text: `{position}` to get user position at the leaderboard\n`{name}` user name\n`{tag}` user tag\n`{value}` to get the variable value for the user\nExample: \n```\n$userLeaderBoard[coin;{position}. {name} : {value}]\n```",
code: async (d) => {
const [var, text = "{position}. {name} : {value}", list = 10, page = 1, guildID = d.guild?.id] = d.data.splits;
const guild = d.client.guilds.cache.get(guildID);
let dbs = d.db.all().filter(z => z.key.startsWith(var));
dbs = dbs.filter(z => z.key.split("_")[1] === guildID);
let i = 1;
let lb = [];
for(const db of dbs.sort((a, b) => {
return Number(b.value) - Number(a.value)
        })) {
const uid = db.key.split("_")[2];
let user = await guild.members.cache.get(uid);
if(!user) user = await guild.members.fetch(uid, {force: true});
if(user) {
text = text.replace(/\{position\}/g, i);
text = text.replace(/\{name\}/g, user.username);
text = text.replace(/\{id\}/g, user.id);
text = text.replace(/\{tag\}/g, user.tag);
text = text.replace(/\{value\}/g, db.value);
lb.push(text)
}

i += 1
     }
return lb.join("\n")
   }
}
