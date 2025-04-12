const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const {v4: uuidv4} = require("uuid");
const bcrypt = require("bcrypt");
require ("dotenv").config();

const session = require("express-session");
const admin = require("firebase-admin");
// Se importa Firebase Functions
const functions = require("firebase-functions");

// Inicializar Firebase Admin, definiendo la ruta del archivo .json con las credenciales
// de la cuenta de servicio de Firebase y la URL de la base de datos
const serviceAccount = require("./fir-d3539-firebase-adminsdk-duevp-29d56d179d.json");
const { user } = require("firebase-functions/v1/auth");
const { title } = require("process");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();

// Ingeniería de vistas de EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middlewares
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
      secret: "gen-z-secret",
      resave: false,
      saveUninitialized: true,
      cookie: {maxAge: 24 * 60 * 60 * 1000}, // 24 hours
      sameSite: "lax", // Cambia a "lax" o incluso "none" si usas HTTPS
      secure: true // IMPORTANTE: debe ser `true` si estás usando HTTPS
    }),
);

// Middleware para verificar si el usuario está autenticado
function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.message = "Debes iniciar sesión para ver tu carrito";
    return res.redirect("/auth"); // Redirige al login si no hay sesión activa
  }
  next(); // Continúa a la ruta protegida
}

// Middleware para verificar si el usuario es admin
function verificarAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === "admin") {
    return next();
  }
  res.redirect("/auth"); // Redirige si no hay sesión activa o no es admin
}

// Middleware para evitar el almacenamiento en caché
// app.use((req, res, next) => {
//   res.setHeader("Cache-Control", "no-store");
//   next();
// });

// Middelware para cargar el carrito con verificacion de usuario
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
});

// Localizacion de las vistas con Path
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.user = req.session.user || null;
  next();
});

// Error 404
app.use("/error", (req, res) => {
  res.render("reusables/error-404", {
    title: "Error 404"
  });
});

// Index.ejs
app.get("/", async (req, res) => {
  try {
    // Obtenemos hasta 8 productos de la categoria "products"
    const productosSnapshot = await db.collection("products").limit(15).get();
    const productos = [];

    // Recorremos los documentos y los agregamos al array de productos
    productosSnapshot.forEach((doc) => {
      productos.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Obtenemos todas las categorías desde Firestore
    const categoriasSnapshot = await db.collection("categories").get();
    const categorias = [];

    // Recorremos cada categoría y la agregamos al array
    categoriasSnapshot.forEach((doc) => {
      categorias.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Renderizamos la vista 'index.ejs' enviando los datos a la plantilla
    res.render("index", {
      title: "Inicio", // Título de la página
      productos, // Lista de productos destacados (máx. 8)
      categorias, // Lista de categorías disponibles
      cantidadCarrito: req.session.cart.reduce((total, item) => total + item.quantity, 0), // Total de ítems en el carrito
    });
  } catch (error) {
    console.error("Error al obtener los datos:", error);
    res.status(500).render("reusables/error-404", {message: "Error al obtener los datos"});
  }
});

// Productos por categoria
app.get("/products", async (req, res) => {
  try {
    // Referencia inicial a la colección de productos
    let productsRef = db.collection("products");

    // Si se recibe un filtro de categoría (por URL), aplicamos el filtro
    if (req.query.category && req.query.category !== "all") {
      productsRef = productsRef.where("category", "==", req.query.category);
    }

    // Obtenemos los productos (filtrados o todos si no hay filtro)
    const productsSnapshot = await productsRef.get();
    const products = [];

    // Recorremos cada documento de productos y lo agregamos al array
    productsSnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Obtenemos todas las categorías desde Firestore
    const categoriesSnapshot = await db.collection("categories").get();
    const categories = [];

    // Recorremos cada categoría y la agregamos al array
    categoriesSnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Renderizamos la vista 'products.ejs' y enviamos los datos necesarios
    res.render("products", {
      title: "Todos los Productos", // Título de la página
      products, // Lista de productos a mostrar
      categories, // Lista de categorías para el sidebar
      selectedCategory: req.query.category || "all", // Categoría activa
      sort: req.query.sort || "default", // Orden seleccionado (si lo hay)
      query: req.query, // Todos los parámetros de consulta para usarlos en la vista
      cartCount: req.session.cart.reduce((total, item) => total + item.quantity, 0), // Total de productos en el carrito
    });
  } catch (error) {
    // Si hay un error, lo mostramos en consola y mostramos una página de error
    console.error("Error fetching products:", error);
    res.status(500).render("error", {message: "Error fetching products"});
  }
});

// Productos individuales
app.get("/product/:id", async (req, res) => {
  try {
    const productDoc = await db.collection("products").doc(req.params.id).get();

    if (!productDoc.exists) {
      return res.status(404).render("error", {message: "Product not found"});
    }

    const product = {
      id: productDoc.id,
      ...productDoc.data(),
    };

    res.render("product-detail", {
      title: product.name,
      product,
      cartCount: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).render("error", {message: "Error fetching product"});
  }
});

// Carrito
app.get("/cart", requireAuth, async (req, res) => {

  // Verificamos el inicio de sesion de usuario
  if (req.session.user && req.session.user.id) {
    const userId = req.session.user.id;

    try {
      // Obtenemos el carrito del usuario
      const cartDoc = await db.collection("carts").doc(userId).get();
      req.session.cart = cartDoc.exists ? cartDoc.data().items : [];
    } catch (error) {
      console.error("Error al cargar carrito del usuario:", error);
      req.session.cart = [];
    }
  } else {
    // Si no hay usuario, creamos un carrito vacío
    req.session.cart = req.session.cart || [];
  }

  try {
    // Obtenemos los productos del carrito
    res.render("cart", {
      title: "Carrito de Compras",
      cart: req.session.cart,
      total: req.session.cart.reduce((total, item) => total + item.price * item.quantity, 0),
      cartCount: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    });
  } catch (error) {
    console.error("Error al cargar carrito del usuario:", error);
    res.status(500).send("Error al cargar el carrito");
  }
});

// Agregar al Carrito
app.post("/cart/add", async (req, res) => {
  try {
    // Obtenemos el producto del id de la coleccion "products" de firebase y la cantidad
    const {productId, quantity} = req.body;
    const productDoc = await db.collection("products").doc(productId).get();

    // if (!productDoc.exists) {
    //   return res.status(404).json({error: "Product not found"});
    // }

    // Verificamos si el producto ya está en el carrito
    const product = {
      id: productDoc.id,
      ...productDoc.data(),
    };
    const existingItemIndex = req.session.cart.findIndex((item) => item.id === productId);

    if (existingItemIndex > -1) {
      // Actualizar cantidad
      req.session.cart[existingItemIndex].quantity += Number.parseInt(quantity);
    } else {
      // Agregar nuevo producto al carrito
      req.session.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        brand: product.brand,
        quantity: Number.parseInt(quantity),
      });
    }
    
    // Guardamos los cambios en la sesión
    if (req.session.user && req.session.user.id) {
      const userId = req.session.user.id;
      await db.collection("carts").doc(userId).set({
        items: req.session.cart,
      });
    }
    // console.log("Carrito actualizado:", req.session.cart);
    res.redirect("/cart");
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    res.status(500).json({error: "Error al agregar al carrito"});
  }
});

// Actualizar cantidad de un producto en el carrito
app.post("/cart/update", async (req, res) => {
  // Actualizar cantidad de un producto en el carrito
  const { productId, quantity } = req.body;
  const itemIndex = req.session.cart.findIndex((item) => item.id === productId);

  // Verificamos que el algun producto exista en el carrito
  if (itemIndex > -1) {
    // Actualizar cantidad
    if (Number.parseInt(quantity) > 0) {
      req.session.cart[itemIndex].quantity = Number.parseInt(quantity);
    } else {
      // Desplazar el indice si se elimina el producto
      req.session.cart.splice(itemIndex, 1);
    }
  }

  // Actualizar en Firestore
  if (req.session.user && req.session.user.id) {
    try {
      const userId = req.session.user.id;
      await db.collection("carts").doc(userId).set({
        items: req.session.cart,
      });
    } catch (error) {
      console.error("Error al actualizar carrito en Firestore:", error);
    }
  }

  res.redirect("/cart");
});

// Eliminar un producto del carrito
app.post("/cart/remove", async (req, res) => {
  const { productId } = req.body;

  // Remueve el producto del carrito de la sesión
  req.session.cart = req.session.cart.filter((item) => item.id !== productId);

  // Aca también se actualiza el carrito en Firestore
  if (req.session.user && req.session.user.id) {
    try {
      const userId = req.session.user.id;
      await db.collection("carts").doc(userId).set({
        items: req.session.cart,
      });
    } catch (error) {
      console.error("Error al actualizar carrito en Firestore:", error);
    }
  }

  // Recarga página del carrito
  res.redirect("/cart");
});

// Rutas de verificacion
//Usuarios
app.get("/auth", (req, res) => {
  res.render("auth", {
    title: "Iniciar Sesión",
    user: req.session.user || null,
  });
});

// Crear cuenta
app.post("/auth/signup", async (req, res) => {

  const { name, email, password } = req.body;

  try {
    // Verificar si ya existe el correo
    const userSnapshot = await db.collection("users").where("email", "==", email).get();
    if (!userSnapshot.empty) {
      return res.status(400).send("Este correo ya está registrado.");
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    await db.collection("users").add({
      name,
      email,
      password: hashedPassword,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Guardar sesión
    req.session.user = { name, email };

    res.redirect("/cart");
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).send("Error al registrar usuario");
  }
});

// Iniciar sesión
app.post("/auth/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Comprobación de credenciales de administrador
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      req.session.user = {
        name: "Administrador",
        email,
        role: "admin"
      };
      return res.redirect("/admin"); // Redirigir a dashboard admin
    }

    // Verifica repitencia de correo
    const userSnapshot = await db.collection("users").where("email", "==", email).limit(1).get();

    if (userSnapshot.empty) {
      return res.status(401).send("Correo o contraseña incorrectos.");
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    // Comparar contraseña ingresada con la almacenada hasheada
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).send("Correo o contraseña incorrectos.");
    }

    // Guardar el inicio de sesión del usuario
    req.session.user = {
      name: user.name,
      email: user.email,
      id: userDoc.id,
    };

    res.redirect("/");
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).send("Error al iniciar sesión");
  }
});

// Cerrar sesion
app.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
    }
    res.redirect("/");
  });
});

// obtener pedidos del usuario autentificado
app.get("/auth/orders", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    // Obtener pedidos del usuario
    const ordersSnapshot = await db
      .collection("orders")
      .where("customer.uid", "==", req.session.user.uid)
      .orderBy("orderDate", "desc")
      .get();

    // Crear array con el contenido
    const orders = [];
    ordersSnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(orders);
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

//Ordenes
app.get("/checkout", (req, res) => {
  // Obtener productos del carrito
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.redirect("/cart");
  }
  
  // Cargar vista checkout.ejs con los productos del carrito
  res.render("checkout", {
    title: "Verificar Pedido",
    email: req.session.user.email,
    cart: req.session.cart,
    total: req.session.cart.reduce((total, item) => total + item.price * item.quantity, 0),
    cartCount: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    user: req.session.user, // Puedes usar esto para precargar los datos
  });
});

app.post("/checkout", async (req, res) => {
  try {
    // Obtener datos del usuario
    const { identification, delivery, payment } = req.body;

    // Validar datos esenciales
    if (
      !identification?.email ||
      !identification?.firstName ||
      !identification?.lastName ||
      !delivery?.deliveryMethod ||
      !payment?.paymentMethod
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios." });
    }

    const fullName = `${identification.firstName} ${identification.lastName}`;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    // Crear un nuevo pedido
    const newOrder = {
      customer: {
        name: fullName,
        email: identification.email,
        phone: identification.phone || "",
        dni: identification.dni || "",
      },
      delivery,
      payment,
      items: req.session.cart,
      total: req.session.cart.reduce((t, i) => t + i.price * i.quantity, 0),
      status: "Procesado",
      orderDate: admin.firestore.FieldValue.serverTimestamp(),
      deliveryDate,
      orderId: uuidv4().substring(0, 8).toUpperCase(),
    };

    // Registrarlo en la coleccion orders 
    const orderRef = await db.collection("orders").add(newOrder);

    // Vaciar el carrito
    req.session.cart = [""];

    // Limpiar carrito en Firestore
    if (req.session.user?.uid) {
      await db.collection("carts").doc(req.session.user.uid).set({ items: [] });
    }

    // Enviar a vista de confirmación
    return res.redirect(`/order-confirmation/${orderRef.id}`);
  } catch (error) {
    console.error("Error procesando la orden:", error);
    res.status(500).json({ message: "Error al procesar la orden" });
  }
});

app.get("/order-confirmation/:id", async (req, res) => {
  const orderId = req.params.id;

  // Obtener id del pedido
  if (!orderId) {
    return res.status(400).render("reusables/error-404", { message: "ID de pedido no proporcionado." });
  }

  // Obtener contenido de la coleccion orders con el id del pedido
  try {
    const orderDoc = await db.collection("orders").doc(orderId).get();

    if (!orderDoc.exists) {
      return res.status(404).render("reusables/error-404", { message: "Pedido no encontrado" });
    }

    const order = {
      id: orderDoc.id,
      ...orderDoc.data()
    };

    // Mostrar la vista con el contenido obtenido
    res.render("order-confirmation", {
      title: "Confirmación de Pedido",
      order,
      cartCount: 0,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).render("reusables/error-404", { message: "Error fetching order" });
  }
});

// Ordenes por usuarios
app.get("/user/orders", async (req, res) => {

  try {
    //  Obtener id del usuario
    const snapshot = await db
      .collection("orders")
      .where("customer.email", "==", req.session.user.email)
      .orderBy("orderDate", "desc")
      .get();

    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.render("orders-list", {
      title: "Mis Pedidos",
      orders,
    });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).render("reusables/error-404", {
      message: "No se pudieron cargar tus pedidos.",
    });
  }
});

app.get("/user/orders/:id", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/auth");
  }

  try {
    const orderDoc = await db.collection("orders").doc(req.params.id).get();

    if (!orderDoc.exists) {
      return res.status(404).render("error", { message: "Pedido no encontrado" });
    }

    const order = {
      id: orderDoc.id,
      ...orderDoc.data(),
    };
    
    res.render("orders-view", {
      title: "Mis Pedidos",
      order,
    });       
  } catch (error) {
    console.error("Error al obtener pedido:", error);
    res.status(500).render("reusables/error-404", {
      message: "No se pudo cargar el pedido.",
    });
  }
});

// Productos de usuarios
app.get("/user/products", async (req, res) => {
  res.render("reusables/user-products", {
    title: "Mis Productos",
  })
});

app.post("/user/products/add", async (req, res) => {
  const { name, price, brand, description, image, stock } = req.body;

  try {
    await db.collection("userProducts").add({
      name,
      price: Number(price),
      brand,
      description,
      image,
      stock: Number(stock),
      ownerId: req.session.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.redirect("/reusables/user-products");
  } catch (error) {
    console.error("Error al agregar producto del usuario:", error);
    res.status(500).send("Error al publicar el producto");
  }
});

// Rutas del admin
app.get("/admin", verificarAdmin, async (req, res) => {
  try {
    const productsSnapshot = await db.collection("products").get();
    const products = [];

    productsSnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).render("error", {message: "Error fetching products"});
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      return res.status(500).send("Error al cerrar sesión");
    }

    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

app.get("/admin/product/new", async (req, res) => {
  try {
    const categoriesSnapshot = await db.collection("categories").get();
    const categories = [];

    categoriesSnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.render("admin/product-form", {
      title: "Add New Product",
      product: null,
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).render("error", {message: "Error fetching categories"});
  }
});

app.post("/admin/product/new", async (req, res) => {
  try {
    const {name, brand, description, price, category, image, stock} = req.body;

    await db.collection("products").add({
      name,
      brand,
      description,
      price: Number.parseFloat(price),
      category,
      image,
      stock: Number.parseInt(stock),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.redirect("/admin");
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).render("error", {message: "Error adding product"});
  }
});

app.get("/admin/product/edit/:id", async (req, res) => {
  try {
    const productDoc = await db.collection("products").doc(req.params.id).get();

    if (!productDoc.exists) {
      return res.status(404).render("error", {message: "Product not found"});
    }

    const product = {
      id: productDoc.id,
      ...productDoc.data(),
    };

    const categoriesSnapshot = await db.collection("categories").get();
    const categories = [];

    categoriesSnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.render("admin/product-form", {
      title: "Edit Product",
      product,
      categories,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).render("error", {message: "Error fetching product"});
  }
});

app.post("/admin/product/edit/:id", async (req, res) => {
  try {
    const {name, brand, description, price, category, image, stock} = req.body;

    await db
        .collection("products")
        .doc(req.params.id)
        .update({
          name,
          brand,
          description,
          price: Number.parseFloat(price),
          category,
          image,
          stock: Number.parseInt(stock),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

    res.redirect("/admin");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).render("error", {message: "Error updating product"});
  }
});

app.post("/admin/product/delete/:id", async (req, res) => {
  try {
    await db.collection("products").doc(req.params.id).delete();

    res.redirect("/admin");
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).render("error", {message: "Error deleting product"});
  }
});

// if (require.main === module) {
//   const port = process.env.PORT || 4444;
//   app.listen(port, () => {
//     console.log(`Servidor local escuchando en el puerto ${port}`);
//   });
// }

// Expone el servidor como una función HTTP llamada app para Firebase
exports.app = functions.https.onRequest(app);

//Comando para desplegar manualmente en Firebase
//firebase deploy --only "functions,hosting"