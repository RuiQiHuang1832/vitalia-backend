import "dotenv/config";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import { notFound } from "../middleware/notFound.js";
import { errorHandler } from "../middleware/error.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/auth", authRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
