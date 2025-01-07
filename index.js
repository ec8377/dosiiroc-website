const express = require("express");
const app = express();
const fs = require("fs");
const hash = require("bcryptjs");

app.use(express.static("."));
app.use(express.urlencoded({
    extended:true
}))

app.get("/", (request, response) => {
    fs.readFile(process.cwd() + "/wip.html", "utf-8", (err, html) => {
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

app.get("/main_page", (request, response) => {
    fs.readFile(process.cwd() + "/main_page.html", "utf-8", (err, html) => {
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



app.listen(process.env.PORT, () =>{
    console.log("ON PORT 3000");
});

app.post("/admin_login", (request, response) => {
    console.log(request.body);
    if (request.body.user === process.env.USERNAME && request.body.pass === process.env.PASSWORD) {
        response.redirect("/menu_changer");
    }
    else {
        response.redirect("/admin_login")
    }
});

app.get("/menu_changer", (req, res) => {
    console.log("HELOO");
    res.redirect("/");
});