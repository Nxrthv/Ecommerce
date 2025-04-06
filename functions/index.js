const functions = require("firebase-functions");
const app = require("./server");

exports.app = functions.https.onRequest(app);

//Comando para desplegar en Firebase
//firebase deploy --only "functions,hosting"