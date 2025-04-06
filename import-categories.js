const admin = require("firebase-admin");

const serviceAccount = require("./fir-d3539-firebase-adminsdk-duevp-dea02c0f78.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const categorias = [
  { id: "audio", name: "Audio", icon: "fas fa-headphones" },
  { id: "celulares-accesorios", name: "Celulares y Accesorios", icon: "fas fa-mobile-alt" },
  { id: "gamer", name: "Gamer", icon: "fas fa-gamepad" },
  { id: "computo", name: "Cómputo", icon: "fas fa-laptop" },
  { id: "smart-home", name: "Smart Home", icon: "fas fa-home" },
  { id: "electrohogar", name: "Electrohogar", icon: "fas fa-tv" },
  { id: "cuidado-personal", name: "Cuidado personal", icon: "fas fa-heartbeat" },
  { id: "deportes-aire-libre", name: "Deportes y aire libre", icon: "fas fa-dumbbell" },
  { id: "camaras-drones", name: "Cámaras de Acción y Drones", icon: "fas fa-video" },
  { id: "fotografia", name: "Fotografía", icon: "fas fa-camera" },
];

(async () => {
  try {
    for (const categoria of categorias) {
      await db.collection("categories").doc(categoria.id).set(categoria);
      console.log(`✅ Categoría "${categoria.name}" insertada`);
    }
    console.log("✅ Importación de categorías completada.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al importar categorías:", error);
    process.exit(1);
  }
})();
