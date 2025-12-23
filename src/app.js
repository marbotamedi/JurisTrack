import express from 'express';
import env from 'dotenv';
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import uploadRoute from "./routes/uploadRoute.js";
import n8nRoute from "./routes/n8nRoute.js";
import modalRoute from "./routes/modalRoute.js";
import modelosRoute from "./routes/modelosPeticao.js";
import peticaoRoute from "./routes/peticaoRoute.js";
import processoRoute from "./routes/processosRoute.js";
import locaisRoute from "./routes/locaisRoute.js";
import auxiliarRouter from "./routes/auxiliaresRoute.js";
import pessoasRoute from "./routes/pessoasRoute.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import { tenantContextMiddleware } from "./middlewares/tenantContextMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

env.config({ path: path.join(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT;

app.use(express.static(path.join(__dirname, "../public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Rota */
// Página de upload (HTML público)
app.get("/upload", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "html", "upload.html"));
});

// APIs de upload protegidas por middleware
app.use("/upload", uploadRoute);
app.use("/n8n", n8nRoute);
app.use("/", modalRoute);
app.use("/modelos", modelosRoute);
app.use("/peticoes-finalizadas", peticaoRoute);
app.use("/api/auth", authRoute);
app.use("/api", tenantContextMiddleware);
app.use("/api/processos", processoRoute);
app.use("/api/locais", locaisRoute);
app.use("/api/auxiliares", auxiliarRouter);
app.use("/api/pessoas", pessoasRoute);
app.use("/api/users", userRoute);

/* Rota padrão */

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "html", "login.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "html", "login.html"));
});

app.get("/processos", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public", "html", "processos.html")
  );
});

app.get("/usuarios", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public", "html", "usuarios.html")
  );
});

app.get("/gerenciarPeticao", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public", "html", "gerenciarPeticao.html")
  );
});

app.get("/gerarPeticao", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "html", "gerarPeticao.html"));
});


app.get("/historico", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public", "html", "historicoPeticoes.html"));
});

app.get("/estados", (req, res) => {
  res.sendFile(
    path.join(__dirname,"../public", "html", "estados.html"));
});


app.get("/cidades", (req, res) =>{
  res.sendFile(
    path.join(__dirname, "../public", "html", "cidades.html"));
});

app.get("/comarcas", (req, res) =>{
  res.sendFile
  (path.join(__dirname,"../public", "html", "comarcas.html"));
});

app.get("/tribunais", (req, res) =>{
  res.sendFile(
    (path.join(__dirname, "../public", "html", "tribunais.html"))
  );
});

app.get("/varas", (req, res) => {
  res.sendFile(
    (path.join(__dirname, "../public", "html", "varas.html"))
  );
});

app.get("/instancias", (req, res) => {
  res.sendFile(
    (path.join(__dirname, "../public", "html", "instancias.html"))
  );
});

app.get("/decisoes", (req, res) =>{
  res.sendFile(
    (path.join(__dirname, "../public", "html", "decisoes.html"))
  );
});


app.get("/esferas", (req, res) =>{
  res.sendFile(
    (path.join(__dirname, "../public","html", "esferas.html"))
  );
});

app.get("/fases", (req, res) =>{
  res.sendFile(
    (path.join(__dirname, "../public","html", "fases.html"))
  );
});

app.get("/moedas", (req, res) =>{
  res.sendFile(
    (path.join(__dirname, "../public","html", "moedas.html"))
  );
});

app.get("/pessoas", (req, res) =>{
  res.sendFile(
    (path.join(__dirname, "../public","html", "pessoas.html"))
  );
});

app.get("/ritos", (req, res) =>{
  res.sendFile(
    (path.join(__dirname, "../public","html", "ritos.html"))
  );
});

app.get("/situacoes", (req, res) =>{
  res.sendFile(
    (path.join(__dirname, "../public","html", "situacoes.html"))
  );
});

app.get("/tipoAcao", (req, res) =>{
  res.sendFile(
    (path.join(__dirname, "../public","html", "tipoAcao.html"))
  );
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});