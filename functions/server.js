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
const serviceAccount = require("./fir-d3539-firebase-adminsdk-duevp-38c2549081.json");
// const { user } = require("firebase-functions/v1/auth");
// const { title } = require("process");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();

// Ingeniería de vistas de EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middlewares
app.use(express.urlencoded({extended: true}));
app.use(express.json());
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

// // Middleware para manejar errores de vistas no encontradas
// app.use((err, req, res, next) => {
//   console.error("Error en la aplicación:", err);
  
//   // Verificar si es un error de vista no encontrada
//   if (err.message && err.message.includes("Failed to lookup view")) {
//     return res.status(500).send(`
//       <h1>Error del Servidor</h1>
//       <p>Lo sentimos, ha ocurrido un error al cargar la página.</p>
//       <a href="/">Volver al inicio</a>
//     `);
//   }
  
//   next(err);
// });

// // Middleware para manejar rutas no encontradas
// app.use((req, res) => {
//   res.status(404).render("reusables/error-404", { 
//     message: "Página no encontrada",
//     cartCount: res.locals.cartCount || 0
//   });
// }); 

// Middleware global o en la ruta principal
app.use(async (req, res, next) => {
  try {
    const snapshot = await db.collection("categories").get();
    res.locals.categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    console.error("Error al obtener categorías:", err);
    res.locals.categories = []; // fallback vacío
  }

  next();
});

// Middleware para manejar redirecciones después del login
app.use((req, res, next) => {
  // No redirigir si estamos en la página de autenticación
  if (req.path === '/auth') {
    return next();
  }
  
  if (req.session.returnTo) {
    const returnTo = req.session.returnTo;
    delete req.session.returnTo;
    return res.redirect(returnTo);
  }
  next();
});

// Middleware para inicializar el carrito y calcular totales
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  const { total, cartCount } = calculateCartTotals(req.session.cart);
  res.locals.cartCount = cartCount;
  res.locals.cartTotal = total;
  
  next();
});

// Localizacion de las vistas con Path
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.user = req.session.user || null;
  next();
});

// Index.ejs
app.get("/", async (req, res) => {
  try {
    const { source = "all", category, sort = "default", page = 1 } = req.query;
    const limit = 50;
    const startIndex = (page - 1) * limit;

    // Función para obtener badges
    function getBadges(product) {
      const badges = [];
    
      if (product.discount > 0 && product.discount < 49) {
        badges.push({ type: "Promo", class: "bg-yellow-500 text-white" });
      }
    
      if (product.freeShipping) {
        badges.push({ type: "Envío Gratis", class: "bg-green-600 text-white" });
      }
    
      if (product.discount && product.discount >= 50) {
        badges.push({ type: "Super Ahorro", class: "bg-red-600 text-white" });
      }
    
      return badges;
    }

    // Consultas optimizadas según los filtros
    let productsQuery, userProductsQuery;
    let paginatedProducts = [];
    
    // Aplicar filtros de categoría si es necesario
    if (category && category !== "all") {
      productsQuery = db.collection("products").where("category", "==", category);
      userProductsQuery = db.collection("userProducts").where("category", "==", category);
    } else {
      productsQuery = db.collection("products");
      userProductsQuery = db.collection("userProducts");
    }
    
    // Aplicar ordenamiento en la consulta cuando sea posible
    if (sort === "newest") {
      productsQuery = productsQuery.orderBy("createdAt", "desc");
      userProductsQuery = userProductsQuery.orderBy("createdAt", "desc");
    } else if (sort === "price_asc") {
      productsQuery = productsQuery.orderBy("price", "asc");
      userProductsQuery = userProductsQuery.orderBy("price", "asc");
    } else if (sort === "price_desc") {
      productsQuery = productsQuery.orderBy("price", "desc");
      userProductsQuery = userProductsQuery.orderBy("price", "desc");
    }
    
    // Cargar productos según la fuente seleccionada
    if (source === "genz") {
      // Solo cargar productos de la tienda (colección products)
      const snapshot = await productsQuery.limit(limit).get();
      
      paginatedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isUserProduct: false
      }));
      
    } else if (source === "users") {
      // Solo cargar productos de usuarios (colección userProducts)
      const snapshot = await userProductsQuery.limit(limit).get();
      
      paginatedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isUserProduct: true
      }));
      
    } else {
      // Cargar ambos tipos de productos (all)
      const [productsSnapshot, userProductsSnapshot] = await Promise.all([
        productsQuery.limit(Math.ceil(limit/2)).get(),
        userProductsQuery.limit(Math.ceil(limit/2)).get()
      ]);
      
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isUserProduct: false
      }));
      
      const userProducts = userProductsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isUserProduct: true
      }));
      
      // Combinar productos
      paginatedProducts = [...products, ...userProducts];
      
      // Ordenar después de combinar si es necesario
      if (sort === "newest") {
        paginatedProducts.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
      } else if (sort === "price_asc") {
        paginatedProducts.sort((a, b) => a.price - b.price);
      } else if (sort === "price_desc") {
        paginatedProducts.sort((a, b) => b.price - a.price);
      } else if (sort === "random") {
        paginatedProducts.sort(() => Math.random() - 0.5);
      }
      
      // Limitar al número correcto después de combinar
      paginatedProducts = paginatedProducts.slice(0, limit);
    }
    
    // Solo cargar las categorías destacadas
    const categoriesSnapshot = await db.collection("categories")
      .limit(8)
      .get();
      
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.render("index", {
      title: "Compra online todo lo que te imagines",
      paginatedProducts,
      categories,
      featuredCategories: categories,
      selectedCategory: category || "all",
      selectedSource: source,
      selectedSort: sort,
      query: req.query,
      currentPage: Number(page),
      totalPages: 1, // Simplificado para esta implementación
      cartCount: req.session.cart ? req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0,
      getBadges
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).render("error", { message: "Error fetching products" });
  }
});

// Productos
app.get("/product/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    // Inicializar el carrito si no existe
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Intentar buscar primero en la colección principal
    let productDoc = await db.collection("products").doc(productId).get();
    let isUserProduct = false;

    // Si no existe, buscar en userProducts
    if (!productDoc.exists) {
      productDoc = await db.collection("userProducts").doc(productId).get();
      if (!productDoc.exists) {
        return res.status(404).render("reusables/error-404", { message: "Producto no encontrado" });
      }
      isUserProduct = true;
    }

    const product = {
      id: productDoc.id,
      ...productDoc.data(),
      isUserProduct,
    };

    // Calcular cartCount de forma segura
    const cartCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);

    res.render("reusables/product-detail", {
      title: product.name,
      product,
      cartCount,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).render("reusables/error-404", { message: "Error al obtener el producto" });
  }
});

// Carrito
app.get("/cart", async (req, res) => {
  try {
    // Inicializar el carrito si no existe
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Si el usuario está autenticado, sincronizamos con su carrito en Firestore
    if (req.session.user && req.session.user.id) {
      const userId = req.session.user.id;
      try {
        const cartDoc = await db.collection("carts").doc(userId).get();
        // Solo actualizamos si existe un carrito en Firestore
        if (cartDoc.exists) {
          req.session.cart = cartDoc.data().items || [];
        }
      } catch (error) {
        console.error("Error al cargar carrito del usuario:", error);
        // No sobrescribimos el carrito de sesión en caso de error
      }
    }

    // Calculamos totales
    const total = req.session.cart.reduce((total, item) => {
      const itemPrice = item.price * (1 - (item.discount || 0) / 100);
      return total + (itemPrice * item.quantity);
    }, 0);
    
    const cartCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);

    // Renderizamos la vista del carrito
    res.render("./reusables/cart", {
      title: "Carrito de Compras",
      cart: req.session.cart,
      total,
      cartCount,
      user: req.session.user || null
    });
  } catch (error) {
    console.error("Error al cargar carrito:", error);
    res.status(500).send("Error al cargar el carrito");
  }
});

// Agregar al Carrito
app.post("/cart/add", async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const isAjaxRequest = req.xhr || req.headers.accept.indexOf('json') > -1;
    
    // Inicializar el carrito si no existe
    if (!req.session.cart) {
      req.session.cart = [];
    }
    
    let productDoc = await db.collection("products").doc(productId).get();
    let isUserProduct = false;

    // Si no existe en 'products', buscar en 'userProducts'
    if (!productDoc.exists) {
      productDoc = await db.collection("userProducts").doc(productId).get();
      if (!productDoc.exists) {
        if (isAjaxRequest) {
          return res.status(404).json({ 
            success: false, 
            message: "Producto no encontrado" 
          });
        } else {
          return res.status(404).render("reusables/error-404", { message: "Producto no encontrado" });
        }
      }
      isUserProduct = true;
    }

    const product = {
      id: productDoc.id,
      ...productDoc.data(),
    };

    const discount = product.discount || 0;
    const finalPrice = discount > 0
      ? parseFloat((product.price * (1 - discount / 100)).toFixed(2))
      : product.price;

    // Verificamos si el producto ya está en el carrito
    const existingItemIndex = req.session.cart.findIndex((item) => item.id === productId);

    if (existingItemIndex > -1) {
      req.session.cart[existingItemIndex].quantity += parseInt(quantity);
    } else {
      req.session.cart.push({
        id: product.id,
        name: product.name,
        price: finalPrice,
        image: product.image,
        brand: product.brand,
        quantity: parseInt(quantity),
        isUserProduct, // opcional para saber el origen
      });
    }

    // Guardar el carrito en Firestore solo si hay sesión iniciada
    if (req.session.user && req.session.user.id) {
      await db.collection("carts").doc(req.session.user.id).set({
        items: req.session.cart,
        updatedAt: new Date()
      });
    }

    // Calcular el total de items en el carrito
    const cartCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);
    
    // Calcular el subtotal del carrito
    const subtotal = req.session.cart.reduce((total, item) => {
      const itemPrice = item.price * (1 - (item.discount || 0) / 100);
      return total + (itemPrice * item.quantity);
    }, 0);

    // Responder según el tipo de solicitud (AJAX o normal)
    if (isAjaxRequest) {
      return res.json({
        success: true,
        cartCount,
        subtotal,
        message: 'Producto agregado al carrito',
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: parseInt(quantity)
        }
      });
    } else {
      return res.redirect("/cart");
    }
    
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ 
        success: false, 
        message: "Error al agregar al carrito: " + error.message 
      });
    } else {
      return res.status(500).render("reusables/error-500", { message: "Error al agregar al carrito" });
    }
  }
});

// Función de utilidad para calcular totales del carrito de forma segura
function calculateCartTotals(cart = []) {
  if (!cart || !Array.isArray(cart)) {
    return { total: 0, cartCount: 0 };
  }
  
  const total = cart.reduce((total, item) => {
    const itemPrice = item.price * (1 - (item.discount || 0) / 100);
    return total + (itemPrice * item.quantity);
  }, 0);
  
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  
  return { total, cartCount };
}

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
app.get("/auth", (req, res) => {  
  // Si el usuario ya está autenticado sin URL de retorno, redirigir al inicio
  if (req.session.user) {
    return res.redirect('/');
  }
  
  // Mostrar la página de autenticación con cualquier mensaje de error
  res.render("auth", {
    title: "Iniciar Sesión",
    user: null,
    message: req.session.message || null
  });
  
  // Limpiar el mensaje después de mostrarlo
  delete req.session.message;
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
    // Guardar la URL de retorno para redirigir después del login
    req.session.returnTo = "/checkout";
    req.session.message = "Debes iniciar sesión para completar tu compra";
    return res.redirect("/auth");
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
app.get("/checkout", async (req, res) => {
  // Verificar si el usuario está autenticado
  if (!req.session.user) {
    // Guardar la URL de retorno para redirigir después del login
    req.session.returnTo = "/checkout";
    req.session.message = "Debes iniciar sesión para completar tu compra";
    return res.redirect("/auth");
  }
  
  // Verificar si hay productos en el carrito
  if (!req.session.cart || req.session.cart.length === 0) {
    req.session.message = "Tu carrito está vacío";
    return res.redirect("/cart");
  }
  
  try {
    // Sincronizar con el carrito en Firestore (por si acaba de iniciar sesión)
    const userId = req.session.user.id;
    const cartDoc = await db.collection("carts").doc(userId).get();
    
    // Si el usuario tiene un carrito guardado y el carrito de sesión está vacío,
    // usamos el carrito guardado
    if (cartDoc.exists && cartDoc.data().items && cartDoc.data().items.length > 0) {
      // Opcionalmente, podríamos fusionar los carritos si ambos tienen productos
      // Por ahora, simplemente usamos el de Firestore si existe
      req.session.cart = cartDoc.data().items;
    } else if (req.session.cart && req.session.cart.length > 0) {
      // Si no hay carrito en Firestore pero sí en sesión, lo guardamos
      await db.collection("carts").doc(userId).set({
        items: req.session.cart,
        updatedAt: new Date()
      });
    }
    
    const cartCount = req.session.cart.reduce((total, item) => total + item.quantity, 0);

    const cartItems = req.session.cart.map(item => {
      const discount = item.discount || 0;
      const priceWithDiscount = +(item.price * (1 - discount / 100)).toFixed(2);
      
      return {
        ...item,
        priceWithDiscount
      };
    });    

    const total = cartItems.reduce((sum, item) => sum + item.priceWithDiscount * item.quantity, 0);
    
    // Renderizamos la vista de checkout
    res.render("user/shipping-information", {
      title: "Informacion de Envio",
      email: req.session.user.email,
      cart: cartItems,
      total,
      cartCount,
      user: req.session.user
    });
  } catch (error) {
    console.error("Error al procesar checkout:", error);
    res.status(500).send("Error al procesar el checkout");
  }
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
    res.render("user/order-confirmation", {
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
app.get("/orders", async (req, res) => {
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

    res.render("user/orders-list", {
      title: "Mis Pedidos",
      orders,
    });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).render("reusables/error-500", {
      message: "No se pudieron cargar tus pedidos.",
    });
  }
});

app.get("/orders/:id", async (req, res) => {
  try {
    const orderDoc = await db.collection("orders").doc(req.params.id).get();

    if (!orderDoc.exists) {
      return res.status(404).render("error", { message: "Pedido no encontrado" });
    }

    const order = {
      id: orderDoc.id,
      ...orderDoc.data(),
    };
    
    res.render("user/orders-view", {
      title: "Pedido",
      order,
    });       
  } catch (error) {
    console.error("Error al obtener pedido:", error);
    res.status(500).render("reusables/error-404", {
      message: "No se pudo cargar el pedido.",
    });
  }
});

// Cancelar orden
app.post("/order/cancel", async (req, res) => {
  const { orderId, reason } = req.body;

  try {
    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).render("error", { message: "Pedido no encontrado" });
    }

    // Puedes guardar el motivo en otra colección si deseas tener un historial
    await db.collection("cancelledOrders").add({
      ...orderDoc.data(),
      reason,
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Luego eliminas el pedido
    await orderRef.delete();

    res.redirect("/orders");
  } catch (error) {
    console.error("Error cancelando el pedido:", error);
    res.status(500).render("error", { message: "Error cancelando el pedido" });
  }
});

// Productos de usuarios
app.get("/products-list", async (req, res) => {
  try {
    const userId = req.session.user.id;

    const snapshot = await db.collection("userProducts")
      .where("ownerId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.render("user/products-list", {
      title: "Mis Publicaciones",
      products,
      cartCount: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    });
  } catch (error) {
    console.error("Error al obtener productos del usuario:", error);
    res.status(500).render("reusables/error-500", {
      message: "No se pudieron cargar tus productos.",
    });
  }
});

// Agregar productos
app.get("/product-add", async (req, res) => {
  try {
    const userId = req.session.user.id;

    const snapshot = await db.collection("userProducts")
      .where("ownerId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const product = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.render("user/product-add", {
      title: "Publicando Producto",
      product,
      cartCount: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    });
  } catch (error) {
    console.error("Error al obtener productos del usuario:", error);
    res.status(500).render("reusables/error-500", {
      message: "No se pudieron cargar tus productos.",
    });
  }
});

app.post("/products/add", async (req, res) => {
  console.log("REQ BODY:", req.body);
  const {
    name, category, brand, price, discount,
    stock, description, image, freeShipping
  } = req.body;

  if (!req.session.user || !req.session.user.id) {
    return res.status(401).send("No autorizado");
  }

  try {
    await db.collection("userProducts").add({
      name,
      category,
      brand,
      price: Number(price),
      discount: Number(discount),
      stock: Number(stock),
      description,
      image,
      freeShipping: Boolean(freeShipping),
      ownerId: req.session.user.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).send("Producto publicado");
  } catch (error) {
    console.error("Error al agregar producto del usuario:", error);
    res.status(500).send("Error al publicar el producto");
  }
});

// Editar productos
app.get("/product/edit/:id", async (req, res) => {
  try {
    const productDoc = await db.collection("userProducts").doc(req.params.id).get();

    if (!productDoc.exists) {
      return res.status(404).render("reusables/error-404", { message: "Producto no encontrado" });
    }

    const product = { id: productDoc.id, ...productDoc.data() };

    // Verificamos que sea el dueño del producto
    // if (req.session.user?.uid !== product.ownerId) {
    //   return res.status(403).render("reusables/error-403", { message: "Acceso no autorizado" });
    // }

    res.render("user/product-edit", {
      title: "Editar Producto",
      product,
      cartCount: req.session.cart.reduce((t, i) => t + i.quantity, 0),
    });
  } catch (error) {
    console.error("Error al cargar producto para editar:", error);
    res.status(500).render("reusables/error-500", { message: "Error al obtener el producto" });
  }
});

app.post("/product/edit/:id", async (req, res) => {
  const { name, price, brand, description, image, stock, category, discount, freeShipping } = req.body;

  try {
    const productRef = db.collection("userProducts").doc(req.params.id);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return res.status(404).render("reusables/error-404", { message: "Producto no encontrado" });
    }

    const product = productDoc.data();

    // // Verificamos que sea el dueño
    // if (req.session.user?.uid !== product.ownerId) {
    //   return res.status(403).render("reusables/error-403", { message: "Acceso no autorizado" });
    // }

    await productRef.update({
      name,
      price: Number(price),
      brand,
      description,
      image,
      stock: Number(stock),
      category,
      discount: Number(discount),
      freeShipping: freeShipping === "on",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.redirect("/products-list");
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).render("reusables/error-500", { message: "Error al guardar los cambios" });
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

    res.render("admin/products", {
      title: "Todos los Productos",
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
    const {name, brand, description, price, discount, freeShipping, category, image, stock} = req.body;

    await db.collection("products").add({
      name,
      brand,
      description,
      price: Number.parseFloat(price),
      discount: Number.parseInt(discount),
      freeShipping: freeShipping === "on",
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
    const {name, brand, description, price,discount, freeShipping, category, image, stock} = req.body;

    await db
        .collection("products")
        .doc(req.params.id)
        .update({
          name,
          brand,
          description,
          price: Number.parseFloat(price),
          discount: Number.parseInt(discount),
          freeShipping: freeShipping === "on",
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

// Puerto local
if (require.main === module) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Servidor local escuchando en el puerto ${port}`);
  });
}

//Comando para desplegar manualmente en Firebase
//firebase deploy --only "functions,hosting"

// Expone el servidor como una función HTTP llamada app para Firebase
exports.app = functions.https.onRequest(app);