const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 4444;

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBi1Z5ocaNNcmg6eVWYRW9_Gd_1MrdQ5uk",
  authDomain: "fir-d3539.firebaseapp.com",
  databaseURL: "https://fir-d3539-default-rtdb.firebaseio.com",
  projectId: "fir-d3539",
  storageBucket: "fir-d3539.appspot.com",
  messagingSenderId: "1093812896000",
  appId: "1:1093812896000:web:b396d173bb5dac6fed33e5",
  measurementId: "G-NK0EMQYQSS"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("index"); 
})

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});