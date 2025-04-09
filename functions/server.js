/* eslint-env browser */

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const {v4: uuidv4} = require("uuid");
const bcrypt = require("bcrypt");
require ("dotenv").config();

const session = require("express-session");
const admin = require("firebase-admin");

// Inicializar Firebase Admin, definiendo la ruta del archivo .json con las credenciales
// de la cuenta de servicio de Firebase y la URL de la base de datos
const serviceAccount = require("./fir-d3539-firebase-adminsdk-duevp-dea02c0f78.json");
const { user } = require("firebase-functions/v1/auth");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fir-d3539-default-rtdb.firebaseio.com/",
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

// Shopping cart middleware
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
});

// Rutas
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.user = req.session.user || null;
  next();
});

// Ruta de Error 404
app.use("/error", (req, res) => {
  res.render("reusables/error-404", {
    title: "Error 404"
  });
});

// Ruta principal
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
    res.status(500).render("error", {message: "Error al obtener los datos"});
  }
});

// Rutas de productos
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

// Rutas del carrito
app.use(async (req, res, next) => {
  if (req.session.user && req.session.user.id) {
    const userId = req.session.user.id;

    try {
      const cartDoc = await db.collection("carts").doc(userId).get();
      req.session.cart = cartDoc.exists ? cartDoc.data().items : [];
    } catch (error) {
      console.error("Error al cargar carrito del usuario:", error);
      req.session.cart = [];
    }
  } else {
    req.session.cart = req.session.cart || [];
  }

  next();
});

app.get("/cart", requireAuth, async (req, res) => {
  const user = req.session.user;

  if (!user || !user.id) {
    console.error("ID de usuario no disponible en la sesión");
    return res.redirect("/auth");
  }

  try {
    // Si quieres cargar el carrito desde Firestore
    const carritoDoc = await db.collection("carritos").doc(user.id).get();

    const cartData = carritoDoc.exists ? carritoDoc.data().items : [];

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

app.post("/cart/add", async (req, res) => {
  try {
    const {productId, quantity} = req.body;
    const productDoc = await db.collection("products").doc(productId).get();

    if (!productDoc.exists) {
      return res.status(404).json({error: "Product not found"});
    }

    const product = {
      id: productDoc.id,
      ...productDoc.data(),
    };

    // Check if product already in cart
    const existingItemIndex = req.session.cart.findIndex((item) => item.id === productId);

    if (existingItemIndex > -1) {
      // Update quantity
      req.session.cart[existingItemIndex].quantity += Number.parseInt(quantity);
    } else {
      // Add new item
      req.session.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        brand: product.brand,
        quantity: Number.parseInt(quantity),
      });
    }

    if (req.session.user && req.session.user.id) {
      const userId = req.session.user.id;
      await db.collection("carts").doc(userId).set({
        items: req.session.cart,
      });
    }

    console.log("Carrito actualizado:", req.session.cart);

    res.redirect("/cart");
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    res.status(500).json({error: "Error al agregar al carrito"});
  }
});

app.post("/cart/update", async (req, res) => {
  const { productId, quantity } = req.body;

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const itemIndex = req.session.cart.findIndex((item) => item.id === productId);

  if (itemIndex > -1) {
    if (Number.parseInt(quantity) > 0) {
      req.session.cart[itemIndex].quantity = Number.parseInt(quantity);
    } else {
      req.session.cart.splice(itemIndex, 1);
    }
  }

  // Si hay un usuario logueado, actualiza Firestore
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

app.post("/cart/remove", async (req, res) => {
  const { productId } = req.body;

  // Asegura que el carrito exista
  req.session.cart = req.session.cart || [];

  // Remueve el producto del carrito de la sesión
  req.session.cart = req.session.cart.filter((item) => item.id !== productId);

  // Si el usuario está autenticado, también actualiza el carrito en Firestore
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

// Rutas de verificacion

//Usuarios
app.get("/auth", (req, res) => {
  res.render("auth", {
    title: "Bienvenid@",
    user: req.session.user || null,
  });
});

app.get("/account", requireAuth, (req, res) => {
  res.render("account", {
    user: req.session.user,
    title: "Mi Cuenta",
  });
});

app.get("/account/orders", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const ordersSnapshot = await db
      .collection("orders")
      .where("customer.uid", "==", req.session.user.uid)
      .orderBy("orderDate", "desc")
      .get();

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

app.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
    }
    res.redirect("/");
  });
});

app.post("/auth/signup", async (req, res) => {

  const { name, email, password } = req.body;

  try {
    // Verificar si ya existe el correo
    const userSnapshot = await db.collection("users").where("email", "==", email).get();
    if (!userSnapshot.empty) {
      return res.status(400).send("Este correo ya está registrado.");
    }

    // Encriptar la contraseña
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

    res.redirect("/");
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).send("Error al registrar usuario");
  }
});

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

//Pedidos
app.get("/checkout", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/auth"); // Redirige al login si no hay sesión
  }

  if (!req.session.cart || req.session.cart.length === 0) {
    return res.redirect("/cart");
  }

  res.render("checkout", {
    title: "Verificar Pedido",
    cart: req.session.cart,
    total: req.session.cart.reduce((total, item) => total + item.price * item.quantity, 0),
    cartCount: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    user: req.session.user, // Puedes usar esto para precargar los datos
  });
});

app.post("/checkout", async (req, res) => {
  try {
    const {name, email, address, city, zip, paymentMethod} = req.body;

    // Fecha estimada de entrega (7 días)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    // Guardar pedido en Firestore
    const orderRef = await db.collection("orders").add({
      customer: {
        name,
        email,
        address,
        city,
        zip,
      },
      items: req.session.cart,
      total: req.session.cart.reduce((total, item) => total + item.price * item.quantity, 0),
      paymentMethod,
      status: "pending",
      orderDate: admin.firestore.FieldValue.serverTimestamp(),
      deliveryDate: deliveryDate,
      orderId: uuidv4().substring(0, 8).toUpperCase(),
    });

    // Limpiar carrito de sesión y Firestore
    req.session.cart = [];
    await db.collection("carts").doc(req.session.user.uid).delete();

    res.redirect(`/order-confirmation/${orderRef.id}`);
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).render("error", {message: "Error processing order"});
  }
});

app.get("/order-confirmation/:id", async (req, res) => {
  try {
    const orderDoc = await db.collection("orders").doc(req.params.id).get();

    if (!orderDoc.exists) {
      return res.status(404).render("error", {message: "Order not found"});
    }

    const order = {
      id: orderDoc.id,
      ...orderDoc.data(),
    };

    res.render("order-confirmation", {
      title: "Confirmación de Pedido",
      order,
      cartCount: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).render("error", {message: "Error fetching order"});
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

module.exports = app;