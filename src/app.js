import express from 'express';
import env from 'dotenv';
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import uploadRoute from './routes/uploadRoute.js';
import n8nRoute from "./routes/n8nRoute.js";
import modalRoute from "./routes/modalRoute.js";
import modelosRoute from "./routes/modelosPeticao.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

env.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT;

app.use(express.static(path.join(__dirname, '../public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Rota */
app.use("/upload", uploadRoute);
app.use("/n8n", n8nRoute);
app.use("/", modalRoute);
app.use("/modelos", modelosRoute);

/* Rota padrão */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "html", "upload.html"));
});

app.get("/gerenciarPeticao", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "html", "gerenciarPeticao.html"));
});

app.get("/gerarPeticao", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "html", "gerarPeticao.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});