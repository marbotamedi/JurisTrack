const form = document.getElementById('uploadForm');
const messageDiv = document.getElementById('message');

form.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const formData = new FormData(form);
    
    messageDiv.textContent = 'Enviando...';
    messageDiv.style.color = 'blue';

    try {
        // O endpoint é a rota que criamos no Express
        const response = await fetch('/upload', { // http://localhost:3000/upload
            method: 'POST',
            body: formData 
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.textContent = 'Upload bem-sucedido!';
            /*messageDiv.textContent = 'Sucesso! URL do Arquivo: ' + result.publicUrl;+*/
            messageDiv.style.color = 'green';
            console.log('Upload:', result);
            
        } else {
            messageDiv.textContent = 'Erro no Upload: ' + (result.error ||'Detalhes indisponíveis');
            messageDiv.style.color = 'red';
            console.error('Erro:', result);
            console.error('Status:', response.status);
        }

    } catch (error) {
        messageDiv.textContent = 'Extensão não suportada (JPEG, PNG, GIF, PDF)  ou arquivo muito grande (Acima de 5MB).';
        /*messageDiv.textContent = 'Erro de Rede ou Servidor Inacessível.';*/
        messageDiv.style.color = 'darkred';
        console.error('Erro de Rede:', error);
    }
});