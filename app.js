import express from 'express';
import env from 'dotenv';
import uploadRoute from './routes/uploadRoute.js';

env.config();


const app = express();
const PORT = process.env.PORT;


app.use(express.json());

/* Rota */
app.use('/upload', uploadRoute);

/* Rota padrão */

app.get('/', (req, res) => {
  res.send('Servidor de upload de arquivos está funcionando! \n Use a rota /upload para enviar arquivos.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});