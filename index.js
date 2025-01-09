require("dotenv").config();
const express = require("express");
const app = express();
const fs = require("fs");
const fspromise = require("fs").promises
const http = require("http");
const hash = require("bcryptjs");
const { json } = require("stream/consumers");

app.use(express.static("."));
app.use(express.urlencoded({
    extended:true
}))

app.get("/", (request, response) => {
    fs.readFile(process.cwd() + "/main_page.html", "utf-8", (err, html) => {
        if (err) {
            return;
        }

        response.send(html);
    });
});

app.get("/menu_page", (request, response) => {
    fs.readFile(process.cwd() + "/menu_page.html", "utf-8", (err, html) => {
        if (err) {
            return;
        }

        response.send(html);
    });
});

app.get("/about_page", (request, response) => {
    fs.readFile(process.cwd() + "/about_page.html", "utf-8", (err, html) => {
        if (err) {
            return;
        }

        response.send(html);
    });
});

app.get("/admin_login", (request, response) => {
    fs.readFile(process.cwd() + "/login.html", "utf-8", (err, html) => {
        if (err) {
            return;
        }

        response.send(html);
    });
})

app.get("/resources/stylesheet.css", (request, response) => {
    fs.send(process.cwd() + "/resources/stylesheet.css");
});

app.get("/" + process.env.RANDOM_ID, async (req, res) => {
    var html =  await fspromise.readFile(process.cwd() + "/menu_changer.html","utf-8")
    var json_data = await fspromise.readFile(process.cwd() + "/resources/menu/menu.json", "utf-8")
    res.send(html.replaceAll("REPLACE_JSON_STRING", json_data.replaceAll("\n","")));
});

app.listen(process.env.PORT, () =>{
    console.log("ON PORT 3000");
});

app.post("/admin_login", async (req, res) => {
    if (req.body.user === process.env.USERNAME && req.body.pass === process.env.PASSWORD) {
        var html =  await fspromise.readFile(process.cwd() + "/menu_changer.html","utf-8");
        var json_data = await fspromise.readFile(process.cwd() + "/resources/menu/menu.json", "utf-8");
        res.send(html.replaceAll("REPLACE_JSON_STRING", json_data.replaceAll("\n","")));
    }
    else {
        res.redirect("/admin_login");
    }
});

app.post("/JSON_UPLOAD", async (req, res) => {
    await fspromise.writeFile(process.cwd() + "/resources/menu/menu.json", req.body.JSON_UPLOAD);
    res.redirect("/" + process.env.RANDOM_ID)
});

// don't touch beyond this bruh

app.get("*", (req, res) => {
    fs.readFile(process.cwd() + "/404.html", "utf-8", (err, html) => {
        if (err) {
            return;
        }

        res.send(html);
    });
});

function rand_int(max) {
    return Math.floor(Math.random() * max);
} 

// var httpserver = http.createServer(app);
// httpserver.listen(80);