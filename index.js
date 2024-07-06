const { Bot } = require("aoi.js") //require bds.js bot class just usinh aoi.js to set it alr dont mind it
const bot = new Bot({
    intents: [
        "Guilds",
        "GuildMessages",
        "MessageContent",
        "GuildMembers",
        "GuildMessageReactions"
    ],//create your bot intents, put this with your needed
    prefix: "o", //set your bot command prefix to !
   partials: ["Message", "Channel", "Reaction"] // partial are usinh because the new update of bds.js is using discord.js v14
});
bot.onMessage() //callback that execute command when there's message send, put this once in your bot
bot.command({
    name: "ping",
    code: `
 $sendMessage[$channelId;$pingMs]ms
 `
})//create your first ping command
/*
    Note that $sendmessage first part (channelid) is optional
    u can pass that part
    $sendMessage[;$pingMs] will work too
    hmmm
*/
bot.login("MTEzMjk0Nzk0Mjg5NTAwMTY2MQ.GGzc_M.VgfodWl50Vfcazkiz-dP-M0YVyuK91V_QFrxoY") //put your bot token here
