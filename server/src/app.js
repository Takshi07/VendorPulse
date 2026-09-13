import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "VendorPulse API is running"
  });
});

app.use(errorHandler);

export default app;