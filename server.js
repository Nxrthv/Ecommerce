const express = require("express")
const path = require("path")
const cookieParser = require("cookie-parser")
const session = require("express-session")
const admin = require("firebase-admin")
const { v4: uuidv4 } = require("uuid")

// Initialize Firebase Admin
const serviceAccount = require("./fir-d3539-firebase-adminsdk-duevp-dea02c0f78.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fir-d3539-default-rtdb.firebaseio.com/",
})

const db = admin.firestore()

const app = express()
const port = process.env.PORT || 4444

// View engine setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")))
app.use(
  session({
    secret: "electronics-store-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  }),
)

// Shopping cart middleware
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = []
  }
  next()
})

// Routes
app.get("/", async (req, res) => {
  try {
    const productsSnapshot = await db.collection("products").limit(8).get()
    const products = []

    productsSnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    const categoriesSnapshot = await db.collection("categories").get()
    const categories = []

    categoriesSnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    res.render("index", {
      title: "Electronics Store",
      products,
      categories,
      cartCount: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    })
  } catch (error) {
    console.error("Error fetching data:", error)
    res.status(500).render("error", { message: "Error fetching data" })
  }
})

app.get("/products", async (req, res) => {
  try {
    let productsRef = db.collection("products")

    // Apply category filter if provided
    if (req.query.category && req.query.category !== "all") {
      productsRef = productsRef.where("category", "==", req.query.category)
    }

    const productsSnapshot = await productsRef.get()
    const products = []

    productsSnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    const categoriesSnapshot = await db.collection("categories").get()
    const categories = []

    categoriesSnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    res.render("products", {
      title: "All Products",
      products,
      categories,
      selectedCategory: req.query.category || "all",
      cartCount: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    res.status(500).render("error", { message: "Error fetching products" })
  }
})

app.get("/product/:id", async (req, res) => {
  try {
    const productDoc = await db.collection("products").doc(req.params.id).get()

    if (!productDoc.exists) {
      return res.status(404).render("error", { message: "Product not found" })
    }

    const product = {
      id: productDoc.id,
      ...productDoc.data(),
    }

    res.render("product-detail", {
      title: product.name,
      product,
      cartCount: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    res.status(500).render("error", { message: "Error fetching product" })
  }
})

// Cart routes
app.get("/cart", (req, res) => {
  res.render("cart", {
    title: "Shopping Cart",
    cart: req.session.cart,
    total: req.session.cart.reduce((total, item) => total + item.price * item.quantity, 0),
    cartCount: req.session.cart.reduce((total, item) => total + item.quantity, 0),
  })
})

app.post("/cart/add", async (req, res) => {
  try {
    const { productId, quantity } = req.body
    const productDoc = await db.collection("products").doc(productId).get()

    if (!productDoc.exists) {
      return res.status(404).json({ error: "Product not found" })
    }

    const product = {
      id: productDoc.id,
      ...productDoc.data(),
    }

    // Check if product already in cart
    const existingItemIndex = req.session.cart.findIndex((item) => item.id === productId)

    if (existingItemIndex > -1) {
      // Update quantity
      req.session.cart[existingItemIndex].quantity += Number.parseInt(quantity)
    } else {
      // Add new item
      req.session.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: Number.parseInt(quantity),
      })
    }

    res.redirect("/cart")
  } catch (error) {
    console.error("Error adding to cart:", error)
    res.status(500).json({ error: "Error adding to cart" })
  }
})

app.post("/cart/update", (req, res) => {
  const { productId, quantity } = req.body

  const itemIndex = req.session.cart.findIndex((item) => item.id === productId)

  if (itemIndex > -1) {
    if (Number.parseInt(quantity) > 0) {
      req.session.cart[itemIndex].quantity = Number.parseInt(quantity)
    } else {
      req.session.cart.splice(itemIndex, 1)
    }
  }

  res.redirect("/cart")
})

app.post("/cart/remove", (req, res) => {
  const { productId } = req.body

  req.session.cart = req.session.cart.filter((item) => item.id !== productId)

  res.redirect("/cart")
})

// Checkout routes
app.get("/checkout", (req, res) => {
  if (req.session.cart.length === 0) {
    return res.redirect("/cart")
  }

  res.render("checkout", {
    title: "Checkout",
    cart: req.session.cart,
    total: req.session.cart.reduce((total, item) => total + item.price * item.quantity, 0),
    cartCount: req.session.cart.reduce((total, item) => total + item.quantity, 0),
  })
})

app.post("/checkout", async (req, res) => {
  try {
    const { name, email, address, city, zip, paymentMethod } = req.body

    // Calculate delivery date (7 days from now)
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + 7)

    // Create order in Firebase
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
    })

    // Clear cart
    req.session.cart = []

    res.redirect(`/order-confirmation/${orderRef.id}`)
  } catch (error) {
    console.error("Error processing order:", error)
    res.status(500).render("error", { message: "Error processing order" })
  }
})

app.get("/order-confirmation/:id", async (req, res) => {
  try {
    const orderDoc = await db.collection("orders").doc(req.params.id).get()

    if (!orderDoc.exists) {
      return res.status(404).render("error", { message: "Order not found" })
    }

    const order = {
      id: orderDoc.id,
      ...orderDoc.data(),
    }

    res.render("order-confirmation", {
      title: "Order Confirmation",
      order,
      cartCount: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    })
  } catch (error) {
    console.error("Error fetching order:", error)
    res.status(500).render("error", { message: "Error fetching order" })
  }
})

// Admin routes
app.get("/admin", async (req, res) => {
  try {
    const productsSnapshot = await db.collection("products").get()
    const products = []

    productsSnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      products,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    res.status(500).render("error", { message: "Error fetching products" })
  }
})

app.get("/admin/product/new", async (req, res) => {
  try {
    const categoriesSnapshot = await db.collection("categories").get()
    const categories = []

    categoriesSnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    res.render("admin/product-form", {
      title: "Add New Product",
      product: null,
      categories,
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    res.status(500).render("error", { message: "Error fetching categories" })
  }
})

app.post("/admin/product/new", async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body

    await db.collection("products").add({
      name,
      description,
      price: Number.parseFloat(price),
      category,
      image,
      stock: Number.parseInt(stock),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    res.redirect("/admin")
  } catch (error) {
    console.error("Error adding product:", error)
    res.status(500).render("error", { message: "Error adding product" })
  }
})

app.get("/admin/product/edit/:id", async (req, res) => {
  try {
    const productDoc = await db.collection("products").doc(req.params.id).get()

    if (!productDoc.exists) {
      return res.status(404).render("error", { message: "Product not found" })
    }

    const product = {
      id: productDoc.id,
      ...productDoc.data(),
    }

    const categoriesSnapshot = await db.collection("categories").get()
    const categories = []

    categoriesSnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    res.render("admin/product-form", {
      title: "Edit Product",
      product,
      categories,
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    res.status(500).render("error", { message: "Error fetching product" })
  }
})

app.post("/admin/product/edit/:id", async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body

    await db
      .collection("products")
      .doc(req.params.id)
      .update({
        name,
        description,
        price: Number.parseFloat(price),
        category,
        image,
        stock: Number.parseInt(stock),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

    res.redirect("/admin")
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).render("error", { message: "Error updating product" })
  }
})

app.post("/admin/product/delete/:id", async (req, res) => {
  try {
    await db.collection("products").doc(req.params.id).delete()

    res.redirect("/admin")
  } catch (error) {
    console.error("Error deleting product:", error)
    res.status(500).render("error", { message: "Error deleting product" })
  }
})

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

module.exports = app