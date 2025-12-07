import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);
app.use(express.json());

import healthRouter from "./routes/health.route.js";
import companiesRouter from "./routes/companies.route.js";
import employeesRouter from "./routes/employees.route.js";
import documentRouter from "./routes/document.route.js";

app.use("/health", healthRouter);
app.use("/companies", companiesRouter);
app.use("/employees", employeesRouter);
app.use("/document-templates", documentRouter);


// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`API listening on PORT ${PORT}`);
});
