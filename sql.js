const sqlite = require("sqlite-sync");
const path = require("path");
const cd = path.resolve(__dirname, "./");
process.on("message", (message) => {
    switch (message[0]) {
        case "connect":
            sqlite.connect(`${cd}/DB/logging.db`);
            break;
        case "run":
            sqlite.run(message[1], message[2], (res) => {
                process.send(["run", res, message[3], message[4]]);
            })
            break;
        case "insert":
            console.log("SQL.js")
            sqlite.insert(message[1], message[2], () => { })

    }
})