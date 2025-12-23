import postgresClient from '../src/config/postgresClient.js';

(async () => {
  try {
    const ok = await postgresClient.testConnection();
    if (ok) {
      console.log('Conexão com Postgres OK.');
    } else {
      console.error('Conexão retornou resultado inesperado.');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Falha ao testar conexão com Postgres:', error.message);
    process.exitCode = 1;
  } finally {
    await postgresClient.close();
  }
})();

