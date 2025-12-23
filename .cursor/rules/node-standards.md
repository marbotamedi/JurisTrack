# Padrões de Codificação - Node.js (JavaScript)

Este documento define os padrões de codificação para projetos Node.js utilizando JavaScript, visando manter a consistência, legibilidade e manutenibilidade do código.

## Idioma

Todo o código-fonte deve ser escrito em inglês, incluindo nomes de variáveis, funções, classes, comentários e documentação.

**Exemplo:**
```javascript
// ❌ Evite
const nomeDoProduto = "Laptop";
function calcularPreco() {}

// ✅ Prefira
const productName = "Laptop";
function calculatePrice() {}
```

## Convenções de Nomenclatura

### camelCase
Utilize para métodos, funções, variáveis, parâmetros e propriedades de objetos.

**Exemplo:**
```javascript
const userName = "John";
const isActive = true;
function getUserById(id) {}
```

### PascalCase
Utilize para classes.

**Exemplo:**
```javascript
class UserRepository {}
class PaymentGateway {}
```

### kebab-case
Utilize para nomes de arquivos e diretórios. Isso evita problemas de case-sensitivity em diferentes sistemas operacionais (Windows vs Linux).

**Exemplo:**
```
user-repository.js
payment-gateway.service.js
api-controllers/
```

### UPPER_SNAKE_CASE
Utilize para constantes globais ou estáticas que não mudam.

**Exemplo:**
```javascript
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
```

## Nomenclatura Clara

Evite abreviações obscuras, mas evite nomes excessivamente longos (acima de 30 caracteres, se possível). O nome deve revelar a intenção.

**Exemplo:**
```javascript
// ❌ Evite
const usrNm = "John"; // muito abreviado
const userNameFromDatabaseQueryResult = "John"; // muito longo

// ✅ Prefira
const userName = "John";
const dbUser = "John";
```

## Constantes e Magic Numbers

Declare constantes para representar "magic numbers" ou strings mágicas, melhorando a legibilidade e facilitando alterações futuras.

**Exemplo:**
```javascript
// ❌ Evite
if (user.age >= 18) {}
setTimeout(() => {}, 3600000);

// ✅ Prefira
const MINIMUM_AGE = 18;
const ONE_HOUR_IN_MS = 60 * 60 * 1000;

if (user.age >= MINIMUM_AGE) {}
setTimeout(() => {}, ONE_HOUR_IN_MS);
```

## Métodos e Funções

Os métodos e funções devem executar uma única ação clara e bem definida. O nome deve começar com um verbo.

**Exemplo:**
```javascript
// ❌ Evite
function user(id) {}
function userData() {}

// ✅ Prefira
function getUser(id) {}
function fetchUserData() {}
function createUser(data) {}
function updateUserEmail(id, email) {}
```

## Assincronismo (Node.js Específico)

Sempre dê preferência para `async/await` em vez de `Promise.then().catch()` ou callbacks, para evitar o "callback hell" e melhorar a legibilidade do fluxo assíncrono.

**Exemplo:**
```javascript
// ❌ Evite
function getUserData(id) {
  return database.find(id)
    .then(user => {
      return database.getRoles(user.roleId)
        .then(roles => {
           return { ...user, roles };
        });
    })
    .catch(err => console.error(err));
}

// ✅ Prefira
async function getUserData(id) {
  try {
    const user = await database.find(id);
    const roles = await database.getRoles(user.roleId);
    return { ...user, roles };
  } catch (error) {
    throw new Error(`Failed to get user data: ${error.message}`);
  }
}
```

## Tratamento de Erros (Node.js Específico)

Utilize blocos `try/catch` para capturar erros em funções assíncronas. Lance erros utilizando a classe `Error` nativa ou classes de erro customizadas, nunca lance strings ou objetos literais.

**Exemplo:**
```javascript
// ❌ Evite
if (!user) {
  throw "User not found"; // Não lance strings
}

// ✅ Prefira
if (!user) {
  throw new Error("User not found");
}

// Em Controllers/Handlers
try {
  await service.execute();
} catch (error) {
  logger.error(error);
  // Trate o erro adequadamente
}
```

## Parâmetros

Sempre que possível, evite passar mais de 3 parâmetros posicionais. Dê preferência para o uso de objetos ("Named Parameters" pattern) caso necessário.

**Exemplo:**
```javascript
// ❌ Evite
function createUser(name, email, age, address, phone) {}

// ✅ Prefira
function createUser({ name, email, age, address, phone }) {
  // ...
}

// Uso
createUser({
  name: "John",
  email: "john@example.com",
  age: 30,
  address: "123 Main St",
  phone: "555-0123"
});
```

## Efeitos Colaterais e Pureza

Evite efeitos colaterais ocultos. Separe funções que fazem consultas (queries) de funções que fazem alterações (commands).

**Exemplo:**
```javascript
// ❌ Evite
function getUsers() {
  const users = database.query("SELECT * FROM users");
  logger.log("Users fetched"); // efeito colateral
  return users;
}

// ✅ Prefira
async function getUsers() {
  return database.query("SELECT * FROM users");
}

async function fetchAndLogUsers() {
  const users = await getUsers();
  logger.log("Users fetched");
  return users;
}
```

## Estruturas Condicionais

Evite aninhamento profundo (nesting) de if/else. Utilize "Early Returns" (retorno antecipado) para manter o código plano.

**Exemplo:**
```javascript
// ❌ Evite
function processPayment(user, amount) {
  if (user) {
    if (user.isActive) {
      if (amount > 0) {
        return completePayment(user, amount);
      }
    }
  }
}

// ✅ Prefira
function processPayment(user, amount) {
  if (!user || !user.isActive) return;
  if (amount <= 0) return;
  
  return completePayment(user, amount);
}
```

## Flag Parameters

Evite parâmetros booleanos (flags) que alteram drasticamente o comportamento da função. Separe em funções diferentes se necessário.

**Exemplo:**
```javascript
// ❌ Evite
function getUser(id, includeOrders) {}

// ✅ Prefira
function getUser(id) {}
function getUserWithOrders(id) {}
```

## Tamanho de Métodos e Classes

- Evite métodos longos (regra geral: máx 50 linhas).
- Evite classes "God Class" (regra geral: máx 300 linhas).
- Aplique o princípio de Responsabilidade Única (SRP).

## Formatação

Mantenha o código limpo. Use linhas em branco para separar blocos lógicos de código, mas evite excessos.

**Exemplo:**
```javascript
function calculateTotal(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.1;
  return subtotal + tax;
}
```

## Comentários

O código deve ser autoexplicativo. Use comentários apenas para explicar o "PORQUÊ" de uma decisão complexa de negócio ou técnica, não o "O QUE" o código faz. JSDoc é bem-vindo para documentar assinaturas de métodos importantes.

## Declaração de Variáveis

Declare uma variável por linha e evite `var`. Use `const` por padrão e `let` apenas se precisar reatribuir.

**Exemplo:**
```javascript
// ❌ Evite
const name = "John", age = 30;

// ✅ Prefira
const name = "John";
const age = 30;
```

## Escopo de Variáveis

Declare variáveis o mais próximo possível de seu uso. Isso melhora a legibilidade e o gerenciamento de memória.
