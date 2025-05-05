import { createRequire } from "module";
import { rm, rmSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { SquareClient } from "square";

const require = createRequire(import.meta.url);
require("dotenv").config();
const favicon = require("serve-favicon");
const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
const fs = require("fs");
const fspromise = require("fs").promises
const http = require("http");
const bcrypt = require("bcryptjs");
const path = require("path");
const process = require('node:process');
const { json } = require("stream/consumers");
const sharp  = require("sharp");
const cookieParser = require('cookie-parser');
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const client = new SquareClient({ token: process.env.TOKEN });
const id_name_dict = {};
const item_cost = {};
const saltRounds = 10;

const PROCESS_DIR = process.cwd();  
let menu_counter = parseInt(await fspromise.readFile(path.join(PROCESS_DIR, "resources", "menu", "menu_counter.txt")));
const json_backup_data = await fspromise.readFile(PROCESS_DIR + "/resources/menu/menu_BACKUP.json", "utf-8");
let json_data = await fspromise.readFile(PROCESS_DIR + "/resources/menu/menu.json", "utf-8");
let json_object = JSON.parse(json_data);

let files_object = [];
let temp_dirs = await readdir(PROCESS_DIR + "/resources/images/ss_images/");

temp_dirs.forEach((file) => {
    files_object.push("'" + file + "'");
});


let images_addr_string = "[" + files_object.toString() + "]";

let response = await client.catalog.list({types:["ITEM"]});

for await (const item of response) {
    id_name_dict[item.id] = item.itemData.name;
}

response = await client.catalog.list({types: "ITEM_VARIATION"});
for await (const item of response) {
    if (item_cost[id_name_dict[item.itemVariationData.itemId]] != undefined && item_cost[id_name_dict[item.itemVariationData.itemId]] != item.itemVariationData.priceMoney.amount) {
        if ((item.itemVariationData.name.toLowerCase().indexOf("large") < 0) && (item.itemVariationData.name.toLowerCase().indexOf("beef") < 0) && (item.itemVariationData.name.toLowerCase().indexOf("pork") < 0) && (item.itemVariationData.name.toLowerCase().indexOf("seafood") < 0)) {
            item_cost[id_name_dict[item.itemVariationData.itemId]] = item.itemVariationData.priceMoney.amount;
        }
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
    if ((req.path.indexOf(".html") >= 0) || (req.path.indexOf(".js") >= 0) || (req.path.indexOf(".json") >= 0) || (req.path.indexOf(".txt") >= 0) || req.path.indexOf("/resources/fonts") >= 0 || req.path.indexOf("/resources/private") >= 0) {
        console.log("attempted get of prohibited files:" + req.path);
        return true;
    }
    return false;
}

app.use(async function (req, res, next) {
    let check = await check_path(req);
    if (check) {
        res.redirect("/*");
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
app.use(fileUpload());
app.use(cookieParser());


app.get("/", (request, response) => {
    fs.readFile(PROCESS_DIR + "/main_page.html", "utf-8", (err, html) => {
        if (err) {
            console.log(err);
            return;
        }
        
        response.send(html.replaceAll("'REPLACE_IMAGE_ADDR_STRING'", images_addr_string));
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

app.get("/" + process.env.RANDOM_ID, (request, response) => {
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

app.post("/" + process.env.RANDOM_ID, async (req, res) => {
    let password = bcrypt.hashSync(req.body.pass, process.env.SALT);

    if (req.body.user === process.env.USER_NAME && password === process.env.PASSWORD) {
        let html =  await fspromise.readFile(PROCESS_DIR + "/menu_changer.html","utf-8");
        let json_data = await fspromise.readFile(PROCESS_DIR + "/resources/menu/menu.json", "utf-8");
        res.cookie("dosiiroc_userData", {"id":process.env.USER_NAME}, {expire: 40000 + Date.now()});
        res.send(html.replaceAll("REPLACE_JSON_STRING", json_data.replaceAll("\n","").replaceAll("'", "\\'")));
    }
    else {
        res.redirect("/" + process.env.RANDOM_ID);
    }
});

app.post("/JSON_UPLOAD", async (req, res) => {
    await fspromise.writeFile(PROCESS_DIR + "/resources/menu/menu.json", req.body.JSON_UPLOAD);
    await fspromise.writeFile(PROCESS_DIR + "/resources/private/MenuGenerator/menu.json", req.body.JSON_UPLOAD);
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
    await fspromise.writeFile(PROCESS_DIR + "/resources/private/MenuGenerator/menu.json", JSON.stringify(json_object));

    res.send(html.replaceAll("REPLACE_JSON_STRING", JSON.stringify(json_object).replaceAll("\n","").replaceAll("'", "\\'")));
});

app.get("/update_image_page", async (req, res) => {
    let html =  await fspromise.readFile(PROCESS_DIR + "/update_image_page.html","utf-8");
    if (req.cookies.dosiiroc_userData === undefined || (process.env.USER_NAME !== req.cookies.dosiiroc_userData.id)) {
        fs.readFile(PROCESS_DIR + "/404.html", "utf-8", (err, html) => {
            if (err) {
                console.log(err);
                return;
            }
    
            res.send(html);
        });
    }
    else {
        res.send(html.replaceAll("'REPLACE_IMAGE_ADDR_STRING'", images_addr_string));
    }
});

app.post("/UPLOAD_IMAGE", async (req, res) => {
    let html =  await fspromise.readFile(PROCESS_DIR + "/update_image_page.html","utf-8");
    
    if (req.files === null) {
        res.send(html.replaceAll("'REPLACE_IMAGE_ADDR_STRING'", images_addr_string));
        return;
    }
    
    const { image_input } = req.files;
    let file_name = image_input.name;

    while(file_name.indexOf(".") != -1) {
        file_name = file_name.substring(0, file_name.length-1);
    }

    let address = PROCESS_DIR + "/resources/images/ss_images/ss_" + file_name + ".webp";
    let tempdir = PROCESS_DIR + "/resources/images/tempdir/" + image_input.name;
    try {
        await image_input.mv(tempdir);
        await sharp(tempdir).resize(2000, 1280, {fit: "cover"}).webp().toFile(address);
        // rmSync(path.join(tempdir));
    }
    catch {
        console.log("ERROR UPLOADING IMAGE");
    }

    let files_object = [];
    let temp_dirs = await readdir(PROCESS_DIR + "/resources/images/ss_images/");
    
    temp_dirs.forEach((file) => {
        files_object.push("'" + file + "'");
    });

    images_addr_string = "[" + files_object.toString() + "]";
    res.send(html.replaceAll("'REPLACE_IMAGE_ADDR_STRING'", images_addr_string));
});

app.post("/REMOVE_IMAGE", async (req, res) => {
    let html =  await fspromise.readFile(PROCESS_DIR + "/update_image_page.html","utf-8");
    let address = PROCESS_DIR + "/resources/images/ss_images/" + Object.keys(req.body)[0].slice(0, -2);
    try {
        await rmSync(path.join(address))
    }
    catch {
        console.log("ERROR REMOVING IMAGE")
    }
    let files_object = [];
    let temp_dirs = await readdir(PROCESS_DIR + "/resources/images/ss_images/");
        
    temp_dirs.forEach((file) => {
        files_object.push("'" + file + "'");
    });

    images_addr_string = "[" + files_object.toString() + "]";
    res.send(html.replaceAll("'REPLACE_IMAGE_ADDR_STRING'", images_addr_string));
});

app.get("/generate_menu", async (req, res) => {
    try {
        await exec("cd '" + path.join(PROCESS_DIR, "/resources/private/MenuGenerator/") + "' && '" + path.join(PROCESS_DIR, "/resources/private/MenuGenerator/MenuGenerator") + "'");
        var image = fs.createReadStream(path.join(PROCESS_DIR, "/resources/private/MenuGenerator/menu.png"));
    
        image.on('open', function () {
            res.set("Content-Type", "image/png");
            image.pipe(res);
        })
    }
    catch {
        console.log("error generating menu");
    }
});

app.get("/generate_drinks_menu", async (req, res) => {
    try {
        await exec("cd '" + path.join(PROCESS_DIR, "/resources/private/MenuGenerator/") + "' && '" + path.join(PROCESS_DIR, "/resources/private/MenuGenerator/MenuGenerator") + "' drinks");
        var image = fs.createReadStream(path.join(PROCESS_DIR, "/resources/private/MenuGenerator/menu.png"));
    
        image.on('open', function () {
            res.set("Content-Type", "image/png");
            image.pipe(res);
        })
    }
    catch {
        console.log("error generating menu");
    }
});

app.get("/generate_flipped_drinks_menu", async (req, res) => {
    try {
        await exec("cd '" + path.join(PROCESS_DIR, "/resources/private/MenuGenerator/") + "' && '" + path.join(PROCESS_DIR, "/resources/private/MenuGenerator/MenuGenerator") + "' drinks 0");
        var image = fs.createReadStream(path.join(PROCESS_DIR, "/resources/private/MenuGenerator/menu.png"));
    
        image.on('open', function () {
            res.set("Content-Type", "image/png");
            image.pipe(res);
        })
    }
    catch {
        console.log("error generating menu");
    }
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