import { createRequire } from "module";

const require = createRequire(import.meta.url);
require("dotenv").config();
const favicon = require("serve-favicon");
const express = require("express");
const app = express();
const fs = require("fs");
const fspromise = require("fs").promises
const http = require("http");
const hash = require("bcryptjs");
const path = require("path");
const { json } = require("stream/consumers");

const PROCESS_DIR = process.cwd();  
let menu_counter = 30;
let json_data = await fspromise.readFile(PROCESS_DIR + "/resources/menu/menu.json", "utf-8");
let json_backup_data = await fspromise.readFile(PROCESS_DIR + "/resources/menu/menu_BACKUP.json", "utf-8");
let menu_html = await fspromise.readFile(PROCESS_DIR + "/menu_page.html", "utf-8");
menu_html = menu_html.replaceAll("REPLACE_JSON_STRING", json_data.replaceAll("\n","").replaceAll("'", "\\'")).replaceAll("REPLACE_BACKUP_MENU", json_backup_data.replaceAll("\n","").replaceAll("'", "\\'"))

app.use(express.static("."));
app.use(favicon(path.join(PROCESS_DIR, "resources", "images", "favicon.png")));
app.use(express.urlencoded({
    extended:true
}))

app.get("/", (request, response) => {
    fs.readFile(PROCESS_DIR + "/main_page.html", "utf-8", (err, html) => {
        if (err) {
            return;
        }

        response.send(html);
    });
});

app.get("/menu_page", async (request, response) => {
    console.log(++menu_counter + " menu requests")
    response.send(menu_html);
});

app.get("/about_page", (request, response) => {
    fs.readFile(PROCESS_DIR + "/about_page.html", "utf-8", (err, html) => {
        if (err) {
            return;
        }

        response.send(html);
    });
});

app.get("/admin_login", (request, response) => {
    fs.readFile(PROCESS_DIR + "/login.html", "utf-8", (err, html) => {
        if (err) {
            return;
        }

        response.send(html);
    });
})

app.get("/resources/stylesheet.css", (request, response) => {
    fs.send(PROCESS_DIR + "/resources/stylesheet.css");
});

app.get("/" + process.env.RANDOM_ID, async (req, res) => {
    var html =  await fspromise.readFile(PROCESS_DIR + "/menu_changer.html","utf-8");
    var json_data = await fspromise.readFile(PROCESS_DIR + "/resources/menu/menu.json", "utf-8");
    
    res.send(html.replaceAll("REPLACE_JSON_STRING", json_data.replaceAll("\n","").replaceAll("'", "\\'")));
});

app.listen(process.env.PORT, () =>{
    console.log("ON PORT 3000");
});

app.post("/admin_login", async (req, res) => {
    if (req.body.user === process.env.USERNAME && req.body.pass === process.env.PASSWORD) {
        var html =  await fspromise.readFile(PROCESS_DIR + "/menu_changer.html","utf-8");
        var json_data = await fspromise.readFile(PROCESS_DIR + "/resources/menu/menu.json", "utf-8");
        res.send(html.replaceAll("REPLACE_JSON_STRING", json_data.replaceAll("\n","").replaceAll("'", "\\'")));
    }
    else {
        res.redirect("/admin_login");
    }
});

app.post("/JSON_UPLOAD", async (req, res) => {
    await fspromise.writeFile(PROCESS_DIR + "/resources/menu/menu.json", req.body.JSON_UPLOAD);
    res.redirect("/" + process.env.RANDOM_ID)
});

// don't touch beyond this bruh

app.get("*", (req, res) => {
    fs.readFile(PROCESS_DIR + "/404.html", "utf-8", (err, html) => {
        if (err) {
            return;
        }

        res.send(html);
    });
});

function rand_int(max) {
    return Math.floor(Math.random() * max);
} 

var httpserver = http.createServer(app);
httpserver.listen(80);