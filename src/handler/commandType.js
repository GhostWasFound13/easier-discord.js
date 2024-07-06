const newMap = require("../cache Handler/cache.js")
module.exports = {
    shardReady: new Map(),
    shardDisconnect: new Map(),
    shardReconnecting: new Map(),
    alwaysExecute: new newMap(),
    botJoin: new newMap(),
    botLeave: new newMap(),
    default: new newMap(),
    memberJoin: new newMap(),
    memberLeave: new newMap(),
    executable: new newMap(),
    reactionAdd: new newMap()
}
