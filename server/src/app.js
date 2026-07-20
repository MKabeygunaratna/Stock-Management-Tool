const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const auth = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const brandRoutes = require("./routes/brand.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const stockRoutes = require("./routes/stock.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const userRoutes = require("./routes/user.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const accountRoutes = require("./routes/account.routes");
const purchaseRoutes = require("./routes/purchase.routes");
const customerRoutes = require("./routes/customer.routes");
const paymentRoutes = require("./routes/payment.routes");
const supplierRoutes = require("./routes/supplier.routes");
const supplierPaymentRoutes = require("./routes/supplierPayment.routes");
const loginLogRoutes = require("./routes/loginLog.routes");

const app = express();

const allowedOrigins = (
  process.env.CLIENT_ORIGIN ||
  "http://localhost:5173" ||
  "http://192.168.8.14:5173"
)
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // allow same-origin/non-browser requests (no Origin header) and any localhost dev port
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^https?:\/\/localhost:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Serve static files from the client build directory
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/brands", auth, brandRoutes);
app.use("/api/categories", auth, categoryRoutes);
app.use("/api/products", auth, productRoutes);
app.use("/api/stock", auth, stockRoutes);
app.use("/api/dashboard", auth, dashboardRoutes);
app.use("/api/users", auth, userRoutes);
app.use("/api/invoices", auth, invoiceRoutes);
app.use("/api/accounts", auth, accountRoutes);
app.use("/api/purchases", auth, purchaseRoutes);
app.use("/api/customers", auth, customerRoutes);
app.use("/api/payments", auth, paymentRoutes);
app.use("/api/suppliers", auth, supplierRoutes);
app.use("/api/supplier-payments", auth, supplierPaymentRoutes);
app.use("/api/login-logs", auth, loginLogRoutes);

// Serve index.html for all non-API routes (SPA fallback)
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"), (err) => {
    if (err) {
      res.status(404).json({ message: "Not found" });
    }
  });
});

app.use(errorHandler);

module.exports = app;
