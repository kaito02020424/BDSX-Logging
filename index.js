const sqlite = require("sqlite-sync");
const event_1 = require("bdsx/event");
const common_1 = require("bdsx/common");
const nativetype_1 = require("bdsx/nativetype");
const launcher_1 = require("bdsx/launcher");
const command_1 = require("bdsx/bds/command");
const command_2 = require("bdsx/command");
const path = require("path");
const cd = path.resolve(__dirname, "./");
sqlite.connect(`${cd}/DB/logging.db`);
sqlite.run("CREATE TABLE IF NOT EXISTS blocks(name,xuid,mode,block,x,y,z,d,time,unix);", (res) => {
    if (res.error) {
        console.log("[BDSX-Logging]Create table error");
        return;
    }
})
let inspect = {};
const dimension = ["OverWorld", "Nether", "The End"];
function addData(name, xuid, block, mode, x, y, z, dimension) {
    const date = new Date()
    sqlite.insert("blocks", { name: name, xuid: xuid, block: block, mode: mode, x: x, y: y, z: z, d: dimension, time: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`, unix: Math.floor(date.getTime() / 1000) }, (res) => {
        if (res.error) {
            console.log("[BDSX-Logging]Insert data error");
        }
    })
}
function createMessage(data, x, y, z, max) {
    let m = `----§bBDSX-Logging§r----\n(§b${x}§r,§b${y}§r,§b${z}§r):`;
    let h = "";
    let c = 0;
    for (const d of data) {
        if (h !== `§8${d.time}§r`) {
            m += `\n§8${d.time}§r`
            h = `§8${d.time}§r`
        }
        m += `\n[${d.mode == "Place" ? "§a+§r" : "§c-§r"}][§b${d.name}§r] ${d.mode == "Place" ? `${d.block} ` : ""}`
        c += 1;
        if (max <= c && max !== -1) {
            break;
        }
    }
    return m;
}
function nameLookup(data, name) {
    let l = data;

    let m = `----§bBDSX-Logging§r----\n(§b${name}§r):`;
    let h = "";
    let c = 0;
    for (const d of l) {
        if (h !== `§8${d.time}§r`) {
            m += `\n§8${d.time}§r`
            h = `§8${d.time}§r`
        }
        m += `\n[${d.mode == "Place" ? "§a+§r" : "§c-§r"}][§b${d.name}§r] ${d.mode == "Place" ? `${d.block} ` : ""}(§b${d.x}§r,§b${d.y}§r,§b${d.z}§r,§b${d.d}§r)`
        c += 1;
    }
    return m;
}
function rLookup(sorted, x, y, z, r) {
    let m = `----§bBDSX-Logging§r----\n(§bRadius:${r}§r):`;
    let h = "";
    for (const d of sorted) {
        if (h !== `§8${d.time}§r`) {
            m += `\n§8${d.time}§r`
            h = `§8${d.time}§r`
        }
        m += `\n[${d.mode == "Place" ? "§a+§r" : "§c-§r"}][§b${d.name}§r] ${d.mode == "Place" ? `${d.block} ` : ""}(§b${d.x}§r,§b${d.y}§r,§b${d.z}§r)`
    }
    return m;
}
function timeLookup(data, time, di) {
    const days = Math.floor(time / 86400);
    const hours = Math.floor((time % 86400) / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor((time % 60));
    let m = `----§bBDSX-Logging§r----\n(§bTime:${days}days§r,§b${hours}hours§r,§b${minutes}minutes§r,§b${seconds}seconds§r):`;
    let h = "";
    for (const d of data) {
        if (h !== `§8${d.time}§r`) {
            m += `\n§8${d.time}§r`
            h = `§8${d.time}§r`
        }
        m += `\n[${d.mode == "Place" ? "§a+§r" : "§c-§r"}][§b${d.name}§r] ${d.mode == "Place" ? `${d.block} ` : ""}(§b${d.x}§r,§b${d.y}§r,§b${d.z}§r)`
    }
    return m;
}
event_1.events.blockPlace.on(ev => {
    const x = String(ev.blockPos.x);
    const y = String(ev.blockPos.y);
    const z = String(ev.blockPos.z);
    const xuid = ev.player.getXuid();
    if (ev.player.getXuid() in inspect) {
        const data = sqlite.run(`SELECT * FROM blocks WHERE x = ? AND y = ? AND z = ? AND d = ?`, [x, y, z, dimension[ev.blockSource.getDimensionId()]])
        if (data.length == 0) {
            ev.player.sendMessage("No data.")
            return common_1.CANCEL
        }
        console.log(data);
        let m = createMessage(data, x, y, z, inspect[ev.player.getXuid()]);
        ev.player.sendMessage(m);
        return common_1.CANCEL
    }
    addData(ev.player.getNameTag(), ev.player.getXuid(), ev.block.getName(), "Place", x, y, z, dimension[ev.blockSource.getDimensionId()])
});

event_1.events.blockDestroy.on(ev => {
    const x = String(ev.blockPos.x);
    const y = String(ev.blockPos.y);
    const z = String(ev.blockPos.z);
    if (ev.player.getXuid() in inspect) {
        const data = sqlite.run(`SELECT * FROM blocks WHERE x = ? AND y = ? AND z = ? AND d = ?`, [x, y, z, dimension[ev.blockSource.getDimensionId()]])
        if (data.length == 0) {
            ev.player.sendMessage("No data.")
            return common_1.CANCEL
        }
        let m = createMessage(data, x, y, z, inspect[ev.player.getXuid()]);
        ev.player.sendMessage(m);
        return common_1.CANCEL
    }
    addData(ev.player.getNameTag(), ev.player.getXuid(), null, "Break", x, y, z, dimension[ev.blockSource.getDimensionId()])
});
event_1.events.chestOpen.on(ev => {
    const x = String(ev.blockPos.x)
    const y = String(ev.blockPos.y)
    const z = String(ev.blockPos.z)
    addData(ev.player.getNameTag(), ev.player.getXuid(), "Move:OpenChest", "Place", x, y, z, dimension[ev.player.getDimensionId()])
});
//コマンド
launcher_1.bedrockServer.afterOpen().then(() => {
    const bl = command_2.command.register("bl", "BDSX-Logging commands", command_1.CommandPermissionLevel.Operator)

    //inspect
    bl.overload((param, origin, output) => {
        const player = origin.getEntity();
        if (!(player.isPlayer())) return;
        if (player.getXuid() in inspect) {
            delete inspect[player.getXuid()];
            output.success("Disabled inspect mode.");
        } else {
            inspect[player.getXuid()] = -1;
            output.success("Enabled inspect mode.");
        }
    }, {
        mode: command_2.command.enum("inspect", { inspect: 0 })
    })
    bl.overload((param, origin, output) => {
        const player = origin.getEntity();
        if (param.count < 1) {
            output.error("Error:Minimum number of logs to display is 1");
            return;
        }
        if (!(player.isPlayer())) return;
        if (player.getXuid() in inspect) {
            inspect[player.getXuid()] = param.count;
            output.success("Changed log search count.");
        } else {
            inspect[player.getXuid()] = param.count;
            output.success("Enabled inspect mode.");
        }
    }, {
        mode: command_2.command.enum("inspect", { inspect: 0 }),
        count: nativetype_1.int32_t
    })

    //省略型
    bl.overload((param, origin, output) => {
        const player = origin.getEntity();
        if (!(player.isPlayer())) return;
        if (player.getXuid() in inspect) {
            delete inspect[player.getXuid()];
            output.success("Disabled inspect mode.");
        } else {
            inspect[player.getXuid()] = 20;
            output.success("Enabled inspect mode.");
        }
    }, {
        mode: command_2.command.enum("i", { i: 0 })
    })
    bl.overload((param, origin, output) => {
        const player = origin.getEntity();
        if (param.count < 1) {
            output.error("Error:Minimum number of logs to display is 1");
            return;
        }
        if (!(player.isPlayer())) return;
        if (player.getXuid() in inspect) {
            inspect[player.getXuid()] = param.count;
            output.success("Changed log search count.");
        } else {
            inspect[player.getXuid()] = param.count;
            output.success("Enabled inspect mode.");
        }
    }, {
        mode: command_2.command.enum("i", { i: 0 }),
        count: nativetype_1.int32_t
    })

    //lookup
    bl.overload((param, origin, output) => {
        const player = origin.getEntity();
        if (!(player.isPlayer())) return;
        sqlite.run("SELECT * FROM blocks WHERE name = ?", [param.nameTag], (data) => {
            data.reverse();
            player.sendMessage(nameLookup(data, param.nameTag))
        });

    }, {
        mode: command_2.command.enum("lookup", { lookup: 0 }),
        lookupmode: command_2.command.enum("name", { name: 0 }),
        nameTag: nativetype_1.CxxString,
    });

    bl.overload((param, origin, output) => {
        const player = origin.getEntity();
        if (!(player.isPlayer())) return;
        const x = Math.floor(player.getPosition().x)
        const y = Math.floor(player.getPosition().y)
        const z = Math.floor(player.getPosition().z)
        sqlite.run("SELECT * FROM blocks WHERE ((x-?)*(x-?)+(y-?)*(y-?)+(z-?)*(z-?)) <= ? AND d = ?", [x, x, y, y, z, z, Math.pow(param.radius, 2), dimension[player.getDimensionId()]], (data) => {
            data.reverse();
            player.sendMessage(rLookup(data, x, y, z, param.radius));
        });

    }, {
        mode: command_2.command.enum("lookup", { lookup: 0 }),
        lookupmode: command_2.command.enum("r", { r: 0 }),
        radius: nativetype_1.int32_t,
    });

    bl.overload((param, origin, output) => {
        const player = origin.getEntity();
        if (!(player.isPlayer())) return;
        const date = new Date();
        const sumTime = (param.days * 86400 + param.hours * 3600 + param.minutes * 60 + param.seconds);
        const min_time = Math.floor(date.getTime() / 1000) - sumTime;
        sqlite.run("SELECT * FROM blocks WHERE unix > ? AND d = ?", [min_time, dimension[player.getDimensionId()]], (data) => {
            player.sendMessage(timeLookup(data, sumTime));
        })
    }, {
        mode: command_2.command.enum("lookup", { lookup: 0 }),
        lookupmode: command_2.command.enum("time", { time: 0 }),
        days: nativetype_1.int32_t,
        hours: nativetype_1.int32_t,
        minutes: nativetype_1.int32_t,
        seconds: nativetype_1.int32_t
    });
});

event_1.events.serverClose.on(ev => {
    console.log("[BDSX-Logging] Stop...")
})