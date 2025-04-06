const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Inicializar Firebase
const serviceAccount = require("./fir-d3539-firebase-adminsdk-duevp-dea02c0f78.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Leer productos actualizados desde productos-firestore.json
const productos = JSON.parse(fs.readFileSync(path.join(__dirname, "/data/productos-firestore.json"), "utf-8"));

// Insertar productos con todos los campos
async function importarProductos() {
  for (const producto of productos) {
    await db.collection("products").add({
      name: producto.name,
      description: producto.description,
      price: producto.price,
      stock: producto.stock,
      image: producto.image,
      category: producto.category,
      marca: producto.marca,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`📦 Producto "${producto.name}" insertado`);
  }
}

// Ejecutar importación
(async () => {
  try {
    console.log("🚀 Comenzando importación de productos...");
    await importarProductos();
    console.log("✅ Importación completada.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al importar productos:", error);
    process.exit(1);
  }
})();
