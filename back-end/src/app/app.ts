import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import path from "path"; // Importante

import routes from "./routes.index";
import { errorMiddleware } from "./middleware/error.middleware";
import { apiLimiter } from "./middleware/rateLimit.middleware";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Permite imagens externas
  }),
);

app.use(
  cors({
    origin: ["http://localhost:3000", "http://192.168.2.3:3000"],
    credentials: true,
  }),
);

app.set("trust proxy", "loopback");
app.use("/api", apiLimiter);
app.use(express.json());
app.use(cookieParser());

// PASTA PÚBLICA DE UPLOADS
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "..", "..", "uploads")),
);

app.use("/api", routes);
app.use(errorMiddleware);

export default app;
