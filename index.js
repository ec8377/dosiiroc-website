import { createRequire } from "module";
import { SquareClient } from "square";

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
const process = require('node:process');
const { json } = require("stream/consumers");

const client = new SquareClient({ token: process.env.TOKEN });
const id_name_dict = {};
const item_cost = {};

const PROCESS_DIR = process.cwd();  
let menu_counter = parseInt(await fspromise.readFile(path.join(PROCESS_DIR, "resources", "menu", "menu_counter.txt")));
const json_backup_data = await fspromise.readFile(PROCESS_DIR + "/resources/menu/menu_BACKUP.json", "utf-8");
let json_data = await fspromise.readFile(PROCESS_DIR + "/resources/menu/menu.json", "utf-8");
let json_object = JSON.parse(json_data);

let response = await client.catalog.list({types:["ITEM"]});
for await (const item of response) {
    id_name_dict[item.id] = item.itemData.name;
}

response = await client.catalog.list({types: "ITEM_VARIATION"});
for await (const item of response) {
    if (item_cost[id_name_dict[item.itemVariationData.itemId]] != undefined && item_cost[id_name_dict[item.itemVariationData.itemId]] > item.itemVariationData.priceMoney.amount) {
        item_cost[id_name_dict[item.itemVariationData.itemId]] = item.itemVariationData.priceMoney.amount
    }
    else if (item_cost[id_name_dict[item.itemVariationData.itemId]] == undefined) {
        item_cost[id_name_dict[item.itemVariationData.itemId]] = item.itemVariationData.priceMoney.amount
    }
}

json_object.categories.forEach((category) => {
    category.items.forEach((item) => {
        if (item_cost[item.name] != undefined) {
            let temp = new Number(item_cost[item.name]).toString();
            let cost_string = temp.substring(0,temp.length-2) + "." + temp.toString().substring(temp.length-2);
            item.cost = cost_string;
        }
    })

    if (category.name == "Dosiiroc Boxes") {
        let temp = new Number(item_cost["Fried Egg"]).toString();
        let cost_string = temp.substring(0,temp.length-2) + "." + temp.toString().substring(temp.length-2);
        category.egg_price = cost_string;
    }
    else if (category.name == "Korean Ade") {
        let temp = new Number(item_cost["Korean Ade"]).toString();
        let cost_string = temp.substring(0,temp.length-2) + "." + temp.toString().substring(temp.length-2);
        category.ade_price = cost_string;
    }
})

// console.log(item_cost)

await fspromise.writeFile(PROCESS_DIR + "/resources/menu/menu.json", JSON.stringify(json_object));

async function check_path(req) {
    if ((req.path.indexOf(".html") >= 0) || (req.path.indexOf(".js") >= 0) || (req.path.indexOf(".json") >= 0) || (req.path.indexOf(".txt") >= 0)) {
        console.log("attempted get of prohibited files:" + req.path);
        return true;
    }
    return false;
}

app.use(async function (req, res, next) {
    let check = await check_path(req);
    if (check) {
        res.redirect("*");
    }
    else {
        next();
    }
})
app.use(express.static("."));
app.use(favicon(path.join(PROCESS_DIR, "resources", "images", "favicon.png")));
app.use(express.urlencoded({
    extended:true
}));


app.get("/", (request, response) => {
    fs.readFile(PROCESS_DIR + "/main_page.html", "utf-8", (err, html) => {
        if (err) {
            console.log(err);
            return;
        }
 
        response.send(html);
    });
});

app.get("/menu_page", async (request, response) => {
    console.log(++menu_counter + " menu request at " + new Date().toString().substring(0, 25));

    let json_data = await fspromise.readFile(PROCESS_DIR + "/resources/menu/menu.json", "utf-8");
    let menu_html = await fspromise.readFile(PROCESS_DIR + "/menu_page.html", "utf-8");
    menu_html = menu_html.replaceAll("REPLACE_JSON_STRING", json_data.replaceAll("\n","").replaceAll("'", "\\'")).replaceAll("REPLACE_BACKUP_MENU", json_backup_data.replaceAll("\n","").replaceAll("'", "\\'"));

    response.send(menu_html);
});

app.get("/about_page", (request, response) => {
    fs.readFile(PROCESS_DIR + "/about_page.html", "utf-8", (err, html) => {
        if (err) {
            console.log(err);
            return;
        }

        response.send(html);
    });
});

app.get("/admin_login", (request, response) => {
    fs.readFile(PROCESS_DIR + "/login.html", "utf-8", (err, html) => {
        if (err) {
            console.log(err);
            return;
        }

        response.send(html);
    });
})

app.get("/resources/stylesheet.css", (request, response) => {
    response.send(PROCESS_DIR + "/resources/stylesheet.css");
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
        let html =  await fspromise.readFile(PROCESS_DIR + "/menu_changer.html","utf-8");
        let json_data = await fspromise.readFile(PROCESS_DIR + "/resources/menu/menu.json", "utf-8");
        res.send(html.replaceAll("REPLACE_JSON_STRING", json_data.replaceAll("\n","").replaceAll("'", "\\'")));
    }
    else {
        res.redirect("/admin_login");
    }
});

app.post("/JSON_UPLOAD", async (req, res) => {
    await fspromise.writeFile(PROCESS_DIR + "/resources/menu/menu.json", req.body.JSON_UPLOAD);
    let html =  await fspromise.readFile(PROCESS_DIR + "/menu_changer.html","utf-8");
    let json_data = await fspromise.readFile(PROCESS_DIR + "/resources/menu/menu.json", "utf-8");
    res.send(html.replaceAll("REPLACE_JSON_STRING", json_data.replaceAll("\n","").replaceAll("'", "\\'")));
});

app.post("/SQUARE_UPDATE", async (req, res) => {
    let html =  await fspromise.readFile(PROCESS_DIR + "/menu_changer.html","utf-8");
    let json_data = await fspromise.readFile(PROCESS_DIR + "/resources/menu/menu.json", "utf-8");
    let json_object = JSON.parse(json_data);

    let response = await client.catalog.list({types:["ITEM"]});
    for await (const item of response) {
        id_name_dict[item.id] = item.itemData.name;
    }

    response = await client.catalog.list({types: "ITEM_VARIATION"});
    for await (const item of response) {
        if (item_cost[id_name_dict[item.itemVariationData.itemId]] != undefined && item_cost[id_name_dict[item.itemVariationData.itemId]] > item.itemVariationData.priceMoney.amount) {
            item_cost[id_name_dict[item.itemVariationData.itemId]] = item.itemVariationData.priceMoney.amount
        }
        else if (item_cost[id_name_dict[item.itemVariationData.itemId]] == undefined) {
            item_cost[id_name_dict[item.itemVariationData.itemId]] = item.itemVariationData.priceMoney.amount
        }
    }


    json_object.categories.forEach((category) => {
        category.items.forEach((item) => {
            if (item_cost[item.name] != undefined) {
                let temp = new Number(item_cost[item.name]).toString();
                let cost_string = temp.toString().substring(0,temp.length-2) + "." + temp.toString().substring(temp.length-2);
                item.cost = cost_string;
            }
        })

        if (category.name == "Dosiiroc Boxes") {
            let temp = new Number(item_cost["Fried Egg"]).toString();
            let cost_string = temp.substring(0,temp.length-2) + "." + temp.toString().substring(temp.length-2);
            category.egg_price = cost_string;
        }
        else if (category.name == "Korean Ade") {
            let temp = new Number(item_cost["Korean Ade"]).toString();
            let cost_string = temp.substring(0,temp.length-2) + "." + temp.toString().substring(temp.length-2);
            category.ade_price = cost_string;
        }
    })

    await fspromise.writeFile(PROCESS_DIR + "/resources/menu/menu.json", JSON.stringify(json_object));

    res.send(html.replaceAll("REPLACE_JSON_STRING", JSON.stringify(json_object).replaceAll("\n","").replaceAll("'", "\\'")));
});

// don't touch beyond this bruh

app.get("*", (req, res) => {
    fs.readFile(PROCESS_DIR + "/404.html", "utf-8", (err, html) => {
        if (err) {
            console.log(err);
            return;
        }

        res.send(html);
    });
});

// var httpserver = http.createServer(app);
// httpserver.listen(80);