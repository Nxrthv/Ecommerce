const admin = require('firebase-admin');
const serviceAccount = require('./fir-d3539-firebase-adminsdk-duevp-dea02c0f78.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Datos de categorías y productos (copia los arrays JSON de arriba)
const categories = [
    {
      "id": "smartphones",
      "name": "Smartphones",
      "icon": "fas fa-mobile-alt"
    },
    {
      "id": "laptops",
      "name": "Laptops",
      "icon": "fas fa-laptop"
    },
    {
      "id": "tablets",
      "name": "Tablets",
      "icon": "fas fa-tablet-alt"
    },
    {
      "id": "audio",
      "name": "Audio",
      "icon": "fas fa-headphones"
    },
    {
      "id": "cameras",
      "name": "Cámaras",
      "icon": "fas fa-camera"
    },
    {
      "id": "accessories",
      "name": "Accesorios",
      "icon": "fas fa-plug"
    },
    {
      "id": "wearables",
      "name": "Wearables",
      "icon": "fas fa-watch"
    },
    {
      "id": "gaming",
      "name": "Gaming",
      "icon": "fas fa-gamepad"
    }
  ];
const products = [
    {
      "id": "smartphone-001",
      "name": "Smartphone X Pro",
      "description": "Smartphone de última generación con pantalla AMOLED de 6.7 pulgadas, cámara de 108MP, procesador octa-core y 256GB de almacenamiento.",
      "price": 899.99,
      "category": "smartphones",
      "image": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop",
      "stock": 25,
      "createdAt": "2023-01-15T00:00:00Z"
    },
    {
      "id": "smartphone-002",
      "name": "Smartphone Lite",
      "description": "Smartphone económico con excelente rendimiento, pantalla HD de 6.1 pulgadas, cámara dual y 128GB de almacenamiento.",
      "price": 349.99,
      "category": "smartphones",
      "image": "https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=600&auto=format&fit=crop",
      "stock": 42,
      "createdAt": "2023-02-10T00:00:00Z"
    },
    {
      "id": "smartphone-003",
      "name": "Smartphone Ultra",
      "description": "El smartphone más avanzado con pantalla plegable, cámara profesional de 200MP, procesador de última generación y 512GB de almacenamiento.",
      "price": 1299.99,
      "category": "smartphones",
      "image": "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=600&auto=format&fit=crop",
      "stock": 15,
      "createdAt": "2023-03-05T00:00:00Z"
    },
    {
      "id": "laptop-001",
      "name": "Laptop Pro 15",
      "description": "Laptop profesional con pantalla de 15.6 pulgadas, procesador i7, 16GB RAM, 512GB SSD y tarjeta gráfica dedicada.",
      "price": 1299.99,
      "category": "laptops",
      "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=600&auto=format&fit=crop",
      "stock": 18,
      "createdAt": "2023-01-20T00:00:00Z"
    },
    {
      "id": "laptop-002",
      "name": "Laptop Ultralight",
      "description": "Laptop ultraligera con pantalla de 13.3 pulgadas, procesador i5, 8GB RAM y 256GB SSD. Perfecta para movilidad.",
      "price": 899.99,
      "category": "laptops",
      "image": "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=600&auto=format&fit=crop",
      "stock": 22,
      "createdAt": "2023-02-15T00:00:00Z"
    },
    {
      "id": "laptop-003",
      "name": "Laptop Gaming",
      "description": "Laptop para gaming con pantalla de 17.3 pulgadas, procesador i9, 32GB RAM, 1TB SSD y tarjeta gráfica RTX 4080.",
      "price": 1999.99,
      "category": "laptops",
      "image": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600&auto=format&fit=crop",
      "stock": 10,
      "createdAt": "2023-03-10T00:00:00Z"
    },
    {
      "id": "tablet-001",
      "name": "Tablet Pro 12",
      "description": "Tablet profesional con pantalla de 12.9 pulgadas, procesador de alto rendimiento, 256GB de almacenamiento y soporte para lápiz digital.",
      "price": 799.99,
      "category": "tablets",
      "image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop",
      "stock": 20,
      "createdAt": "2023-01-25T00:00:00Z"
    },
    {
      "id": "tablet-002",
      "name": "Tablet Mini",
      "description": "Tablet compacta con pantalla de 8 pulgadas, perfecta para lectura y entretenimiento, con 64GB de almacenamiento.",
      "price": 299.99,
      "category": "tablets",
      "image": "https://images.unsplash.com/photo-1623126908029-58cb08a2b272?q=80&w=600&auto=format&fit=crop",
      "stock": 35,
      "createdAt": "2023-02-20T00:00:00Z"
    },
    {
      "id": "audio-001",
      "name": "Auriculares Inalámbricos Pro",
      "description": "Auriculares inalámbricos con cancelación activa de ruido, 30 horas de batería y calidad de sonido premium.",
      "price": 249.99,
      "category": "audio",
      "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
      "stock": 40,
      "createdAt": "2023-01-30T00:00:00Z"
    },
    {
      "id": "audio-002",
      "name": "Altavoz Bluetooth Portátil",
      "description": "Altavoz bluetooth resistente al agua con 24 horas de batería y sonido envolvente de 360 grados.",
      "price": 129.99,
      "category": "audio",
      "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=600&auto=format&fit=crop",
      "stock": 30,
      "createdAt": "2023-02-25T00:00:00Z"
    },
    {
      "id": "audio-003",
      "name": "Auriculares Gaming",
      "description": "Auriculares para gaming con sonido surround 7.1, micrófono con cancelación de ruido y luces RGB personalizables.",
      "price": 149.99,
      "category": "audio",
      "image": "https://images.unsplash.com/photo-1599669454699-248893623440?q=80&w=600&auto=format&fit=crop",
      "stock": 25,
      "createdAt": "2023-03-15T00:00:00Z"
    },
    {
      "id": "camera-001",
      "name": "Cámara DSLR Profesional",
      "description": "Cámara DSLR de 24MP con grabación de video 4K, ISO expandible hasta 51200 y sistema de enfoque automático avanzado.",
      "price": 1499.99,
      "category": "cameras",
      "image": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop",
      "stock": 12,
      "createdAt": "2023-02-01T00:00:00Z"
    },
    {
      "id": "camera-002",
      "name": "Cámara Mirrorless Compacta",
      "description": "Cámara mirrorless compacta de 20MP con grabación de video 4K, pantalla táctil y conectividad WiFi.",
      "price": 899.99,
      "category": "cameras",
      "image": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=600&auto=format&fit=crop",
      "stock": 18,
      "createdAt": "2023-03-01T00:00:00Z"
    },
    {
      "id": "accessory-001",
      "name": "Cargador Inalámbrico Rápido",
      "description": "Cargador inalámbrico de 15W compatible con todos los dispositivos con carga inalámbrica Qi.",
      "price": 39.99,
      "category": "accessories",
      "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600&auto=format&fit=crop",
      "stock": 50,
      "createdAt": "2023-02-05T00:00:00Z"
    },
    {
      "id": "accessory-002",
      "name": "Powerbank 20000mAh",
      "description": "Batería externa de 20000mAh con carga rápida y múltiples puertos para cargar varios dispositivos simultáneamente.",
      "price": 49.99,
      "category": "accessories",
      "image": "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=600&auto=format&fit=crop",
      "stock": 45,
      "createdAt": "2023-03-05T00:00:00Z"
    },
    {
      "id": "accessory-003",
      "name": "Hub USB-C 8 en 1",
      "description": "Hub USB-C con puertos HDMI, USB 3.0, lector de tarjetas SD y microSD, y puerto de carga PD.",
      "price": 59.99,
      "category": "accessories",
      "image": "https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?q=80&w=600&auto=format&fit=crop",
      "stock": 35,
      "createdAt": "2023-03-20T00:00:00Z"
    },
    {
      "id": "wearable-001",
      "name": "Smartwatch Pro",
      "description": "Smartwatch con pantalla AMOLED, monitorización de salud 24/7, GPS integrado y batería de larga duración.",
      "price": 299.99,
      "category": "wearables",
      "image": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&auto=format&fit=crop",
      "stock": 22,
      "createdAt": "2023-02-10T00:00:00Z"
    },
    {
      "id": "wearable-002",
      "name": "Pulsera de Actividad",
      "description": "Pulsera de actividad con monitorización de ritmo cardíaco, seguimiento del sueño y resistencia al agua.",
      "price": 79.99,
      "category": "wearables",
      "image": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?q=80&w=600&auto=format&fit=crop",
      "stock": 38,
      "createdAt": "2023-03-10T00:00:00Z"
    },
    {
      "id": "gaming-001",
      "name": "Consola de Videojuegos Pro",
      "description": "Consola de última generación con 1TB de almacenamiento, gráficos 4K y controlador inalámbrico incluido.",
      "price": 499.99,
      "category": "gaming",
      "image": "https://images.unsplash.com/photo-1605901309584-818e25960a8f?q=80&w=600&auto=format&fit=crop",
      "stock": 15,
      "createdAt": "2023-02-15T00:00:00Z"
    },
    {
      "id": "gaming-002",
      "name": "Controlador Gaming Inalámbrico",
      "description": "Controlador inalámbrico para PC y consolas con botones programables, gatillos adaptativos y vibración háptica.",
      "price": 69.99,
      "category": "gaming",
      "image": "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?q=80&w=600&auto=format&fit=crop",
      "stock": 30,
      "createdAt": "2023-03-15T00:00:00Z"
    }
  ];

// Importar categorías
async function importCategories() {
  for (const category of categories) {
    await db.collection('categories').doc(category.id).set(category);
    console.log(`Categoría importada: ${category.name}`);
  }
}

// Importar productos
async function importProducts() {
  for (const product of products) {
    await db.collection('products').doc(product.id).set({
      ...product,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(product.createdAt))
    });
    console.log(`Producto importado: ${product.name}`);
  }
}

// Ejecutar importación
async function importData() {
  try {
    await importCategories();
    await importProducts();
    console.log('Importación completada con éxito');
  } catch (error) {
    console.error('Error durante la importación:', error);
  }
}

importData();