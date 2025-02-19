module.exports = async (msg, real) => {
    const client = real.client;
    const db = real.db;
    const cmd = real.cmd;
    let lower = msg.content.toLowerCase();
    let body = lower.replace(client.prefix, "").trim();
    let name = Array.from(cmd.default).filter(z => body.startsWith(z[0])).map(z => z[0]).toString();
    let cmds = cmd.default.get(name);

    let withPref = cmds?.withPrefix == undefined || cmds?.withPrefix == true ? msg.content?.toLowerCase().startsWith(client?.prefix) : !lower.startsWith(client.prefix) ? true : false;
    console.log("Message event params: ", withPref);

    if (withPref && cmds?.code && !msg.author?.bot) {
        console.log("Code is a string");
        require("../function.js")(cmds.code, name, db, msg, client, real);
    } else if (withPref && cmds?.execute && !msg.author?.bot && typeof cmds.execute === 'function') {
        console.log("Code is a function");
        require("../function.js")(cmds.execute, name, db, msg, client, real);
    }
};
