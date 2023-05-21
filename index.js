const child_process = require("child_process");
const event_1 = require("bdsx/event");
const common_1 = require("bdsx/common");
const nativetype_1 = require("bdsx/nativetype");
const launcher_1 = require("bdsx/launcher");
const command_1 = require("bdsx/bds/command");
const command_2 = require("bdsx/command");
const path = require("path");
const cd = path.resolve(__dirname, "./");
const sqlite = child_process.fork(`${cd}/sql.js`);
sqlite.send(["connect"], (err) => {
    if (err) {
        console.log(`[BDSX-Logging]Error! Error Log:\n${err}`)
        return;
    }
    sqlite.send(["run", "CREATE TABLE IF NOT EXISTS blocks(name,xuid,mode,block,x,y,z,d,time,unix);", [], "Create", null], (err) => {
        if (err) {
            console.log("[BDSX-Logging]Create table error");
            return;
        }
    })
})

let inspect = {};
const dimension = ["OverWorld", "Nether", "The End"];

//functions
function addData(name, xuid, block, mode, x, y, z, dimension) {
    const date = new Date()
    sqlite.send(["insert", "blocks", { name: name, xuid: xuid, block: block, mode: mode, x: x, y: y, z: z, d: dimension, time: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`, unix: Math.floor(date.getTime() / 1000) }])
}
function createMessage(data, x, y, z, max) {
    if (data.length > max && max !== -1) {
        return createMessage(data.slice(data.length-max),x,y,z,max)
    }
    let m = `----§bBDSX-Logging§r----\n(§b${x}§r,§b${y}§r,§b${z}§r):`;
    let h = "";
    for (const d of data) {
        if (h !== `§8${d.time}§r`) {
            m += `\n§8${d.time}§r`
            h = `§8${d.time}§r`
        }
        m += `\n[${d.mode == "Place" ? "§a+§r" : "§c-§r"}][§b${d.name}§r] ${d.mode == "Place" ? `${d.block} ` : ""}`
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

function getPlayer(nameTag) {
    for (let player of launcher_1.bedrockServer.serverInstance.getPlayers()) {
        if (player.getNameTag() == nameTag) {
            return player;
        }
    }
    return undefined;
}
//events
event_1.events.blockPlace.on(ev => {
    const x = ev.blockPos.x;
    const y = ev.blockPos.y;
    const z = ev.blockPos.z;
    const xuid = ev.player.getXuid();
    if (ev.player.getXuid() in inspect) {
        sqlite.send(["run", "SELECT * FROM blocks WHERE x = ? AND y = ? AND z = ? AND d = ? ORDER BY unix ASC", [x, y, z, dimension[ev.blockSource.getDimensionId()]], "inspect", [ev.player.getNameTag(), x, y, z, ev.player.getXuid()]], (err) => {
            if (err) {
                console.log(`[BDSX-Logging]Error! Error Log:\n${err}`)
            }
        })
        return common_1.CANCEL;
    }
    addData(ev.player.getNameTag(), ev.player.getXuid(), ev.block.getName(), "Place", x, y, z, dimension[ev.blockSource.getDimensionId()])
});

event_1.events.blockDestroy.on(ev => {
    const x = ev.blockPos.x;
    const y = ev.blockPos.y;
    const z = ev.blockPos.z;
    if (ev.player.getXuid() in inspect) {
        sqlite.send(["run", "SELECT * FROM blocks WHERE x = ? AND y = ? AND z = ? AND d = ? ORDER BY unix ASC", [x, y, z, dimension[ev.blockSource.getDimensionId()]], "inspect", [ev.player.getNameTag(), x, y, z, ev.player.getXuid()]], (err) => {
            if (err) {
                console.log(`[BDSX-Logging]Error! Error Log:\n${err}`)
            }
        })
        return common_1.CANCEL;
    }
    addData(ev.player.getNameTag(), ev.player.getXuid(), null, "Break", x, y, z, dimension[ev.blockSource.getDimensionId()])
});
event_1.events.chestOpen.on(ev => {
    const x = ev.blockPos.x
    const y = ev.blockPos.y
    const z = ev.blockPos.z
    addData(ev.player.getNameTag(), ev.player.getXuid(), "Move:OpenChest", "Place", x, y, z, dimension[ev.player.getDimensionId()])
});


//commands
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
        sqlite.send(["run", "SELECT * FROM blocks WHERE name = ? ORDER BY unix ASC", [param.nameTag], "nameLookup", [player.getNameTag(), param.nameTag]], (err) => {
            console.log(`[BDSX-Logging]Error! Error Log:\n${err}`)
        })
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
        sqlite.send(["run", "SELECT * FROM blocks WHERE ((x-?)*(x-?)+(y-?)*(y-?)+(z-?)*(z-?))<=? AND d=? ORDER BY unix ASC", [x, x, y, y, z, z, param.radius ** 2, dimension[player.getDimensionId()]], "rLookup", [player.getNameTag(), x, y, z, param.radius]])
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
        sqlite.send(["run", "SELECT * FROM blocks WHERE unix > ? AND d = ? ORDER BY unix ASC", [min_time, dimension[player.getDimensionId()]], "timeLookup", [player.getNameTag(), sumTime]])
    }, {
        mode: command_2.command.enum("lookup", { lookup: 0 }),
        lookupmode: command_2.command.enum("time", { time: 0 }),
        days: nativetype_1.int32_t,
        hours: nativetype_1.int32_t,
        minutes: nativetype_1.int32_t,
        seconds: nativetype_1.int32_t
    });
});

//stop処理
event_1.events.serverClose.on(ev => {
    console.log("[BDSX-Logging] Stop...")
    sqlite.kill()
})

//SQL結果受け取り
sqlite.on("message", (res) => {
    switch (res[2]) {
        case "Create": {
            break;
        }
        case "inspect": {
            const data = res[1];
            const player = getPlayer(res[3][0]);
            const x = res[3][1]
            const y = res[3][2]
            const z = res[3][3]
            const xuid = res[3][4]
            if (data.length == 0) {
                player.sendMessage("No data.")
                break;
            }
            let m = createMessage(data, x, y, z, inspect[xuid]);
            player.sendMessage(m);
            break;
        }
        case "nameLookup": {
            const data = res[1];
            const player = getPlayer(res[3][0])
            if (data.error) {
                console.log("[BDSX-Logging]Select data error")
                break;
            }
            player.sendMessage(nameLookup(data, res[3][1]))
            break;
        }
        case "rLookup": {
            const data = res[1];
            const player = getPlayer(res[3][0])
            const x = res[3][1]
            const y = res[3][2]
            const z = res[3][3]
            const radius = res[3][4]
            if (data.error) {
                console.log("[BDSX-Logging]Select data error")
                break;
            }
            player.sendMessage(rLookup(data, x, y, z, radius));
            break;
        }
        case "timeLookup": {
            const data = res[1];
            const player = getPlayer(res[3][0]);
            const sumTime = res[3][1]
            if (data.error) {
                console.log("[BDSX-Logging]Select data error")
                break;
            }
            player.sendMessage(timeLookup(data, sumTime));
            break;
        }


    }
})