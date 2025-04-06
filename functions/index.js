/* eslint-env browser */

const functions = require("firebase-functions");
const app = require("./server");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");

// Configuración de vistas
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({
  secret: "gen-z-secret",
  resave: false,
  saveUninitialized: true,
  cookie: {maxAge: 24 * 60 * 60 * 1000}, // 24h
}));

// Ruta principal de prueba
app.get("/", (req, res) => {
  res.render("index", {title: "GEN Z"});
});

// Aquí puedes importar tus rutas reales
// require("./routes/productos")(app);

exports.app = functions.https.onRequest(app);
