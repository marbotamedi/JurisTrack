import express from 'express';
import env from 'dotenv';
import uploadRoute from './routes/uploadRoute.js';
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

env.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Rota */
app.use("/upload", uploadRoute);

/* Rota padrão */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "upload.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});