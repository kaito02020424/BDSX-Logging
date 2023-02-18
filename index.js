const event_1 = require("bdsx/event");
const common_1 = require("bdsx/common");
const nativetype_1 = require("bdsx/nativetype");
const launcher_1 = require("bdsx/launcher");
const command_1 = require("bdsx/bds/command");
const command_2 = require("bdsx/command");
const path = require("path");
const cd = path.resolve(__dirname, "./");
const fs = require("fs");
let database = JSON.parse(fs.readFileSync(`${cd}/DB/logging.json`));
let inspect = {};
const dimension = ["OverWorld", "Nether", "The End"];
function addData(name, xuid, block, mode, x, y, z, dimension) {
    const date = new Date()
    if (!(x in database.xyz[dimension])) {
        database.xyz[dimension][x] = {}
    }
    if (!(y in database.xyz[dimension][x])) {
        database.xyz[dimension][x][y] = {}
    }
    if (!(z in database.xyz[dimension][x][y])) {
        database.xyz[dimension][x][y][z] = []
    }
    if (block === null) {
        database.xyz[dimension][x][y][z].unshift({ name: name, xuid: xuid, mode: mode, time: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`, unix: Math.floor(date.getTime() / 1000) });
        database.normal.unshift({ name: name, xuid: xuid, mode: mode, x: x, y: y, z: z, d: dimension, time: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`, unix: Math.floor(date.getTime() / 1000) });
        fs.writeFileSync(`${cd}/DB/logging.json`, JSON.stringify(database, null, 4));
        return;
    }
    database.xyz[dimension][x][y][z].unshift({ name: name, xuid: xuid, block: block, mode: mode, time: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`, unix: Math.floor(date.getTime() / 1000) });
    database.normal.unshift({ name: name, xuid: xuid, block: block, mode: mode, x: x, y: y, z: z, d: dimension, time: `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`, unix: Math.floor(date.getTime() / 1000) });
    fs.writeFileSync(`${cd}/DB/logging.json`, JSON.stringify(database, null, 4));
}
function createMessage(data, x, y, z, xuid, max) {
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
async function nameLookup(data, name) {
    let l = [];
    for (const d of data) {
        if (d.name === name) {
            l.push(d);
        }
    }

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
async function rLookup(data, x, y, z, r) {
    let save = [];
    for (const j in data) {
        for (const k in data[j]) {
            for (const l in data[j][k]) {
                const d = data[j][k][l];
                if (Math.sqrt((Number(j) - x) ** 2 + (Number(k) - y) ** 2 + (Number(l) - z) ** 2) <= r) {
                    for (const dd of d) {
                        let fix = dd
                        fix.x = j;
                        fix.y = k;
                        fix.z = l;
                        save.push(fix);
                    }
                }
            }
        }
    }
    const sorted = save.sort((a, b) => {
        return (a.unix > b.unix) ? -1 : 1;
    });
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
event_1.events.blockPlace.on(ev => {
    ev.blockSource.getDimensionId()
    const date = new Date()
    const x = String(ev.blockPos.x);
    const y = String(ev.blockPos.y);
    const z = String(ev.blockPos.z);
    const xuid = ev.player.getXuid();
    if (ev.player.getXuid() in inspect) {
        let data
        try {
            data = database.xyz[dimension[ev.player.getDimensionId()]][x][y][z];
        } catch (e) {
            ev.player.sendMessage("No data.")
            return common_1.CANCEL;
        }
        if (data === null || data === undefined) {
            ev.player.sendMessage("No data.")
            return common_1.CANCEL;
        }
        let m = createMessage(data, x, y, z, xuid, inspect[ev.player.getXuid()]);
        ev.player.sendMessage(m);
        return common_1.CANCEL
    }
    addData(ev.player.getNameTag(), ev.player.getXuid(), ev.block.getName(), "Place", x, y, z, dimension[ev.blockSource.getDimensionId()])
});

event_1.events.blockDestroy.on(ev => {
    const date = new Date()
    const x = String(ev.blockPos.x);
    const y = String(ev.blockPos.y);
    const z = String(ev.blockPos.z);
    const xuid = ev.player.getXuid();
    if (ev.player.getXuid() in inspect) {
        let data
        try {
            data = database.xyz[dimension[ev.blockSource.getDimensionId()]][x][y][z];
        } catch (e) {
            ev.player.sendMessage("No data.")
            return common_1.CANCEL;
        }
        if (data === null || data === undefined) {
            ev.player.sendMessage("No data.")
            return common_1.CANCEL;
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
})
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
        const data = database.normal
        nameLookup(data, param.nameTag).then(m => {
            player.sendMessage(m);
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
        const data = database.xyz[dimension[player.getDimensionId()]]
        rLookup(data, x, y, z, param.radius).then(m => {
            player.sendMessage(m);
        })
    }, {
        mode: command_2.command.enum("lookup", { lookup: 0 }),
        lookupmode: command_2.command.enum("r", { r: 0 }),
        radius: nativetype_1.int32_t,
    });
});