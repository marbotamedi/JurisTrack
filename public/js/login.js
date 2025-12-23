const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("senha");
const submitButton = document.getElementById("submit-button");
const feedback = document.getElementById("feedback");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STORAGE_TOKEN_KEY = "juristrack_token";
const STORAGE_USER_KEY = "juristrack_userId";
const STORAGE_ROLE_KEY = "juristrack_role";
const STORAGE_TENANT_KEY = "juristrack_tenantId";
const GENERIC_MESSAGE = "Credenciais inválidas ou usuário inativo.";

function setFeedback(message, state) {
  feedback.textContent = message ?? "";
  if (state) {
    feedback.dataset.state = state;
  } else {
    feedback.removeAttribute("data-state");
  }
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  form.setAttribute("aria-busy", String(isLoading));
  submitButton.textContent = isLoading ? "Entrando..." : "Entrar";
}

function validateFields() {
  const email = emailInput.value.trim();
  const senha = passwordInput.value;

  if (!email || !senha) {
    return {
      valid: false,
      message: "Preencha e-mail e senha para continuar.",
    };
  }

  if (!EMAIL_REGEX.test(email.toLowerCase())) {
    return {
      valid: false,
      message: "Informe um e-mail válido.",
    };
  }

  return { valid: true };
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

async function handleSubmit(event) {
  event.preventDefault();
  setFeedback("");

  const validation = validateFields();
  if (!validation.valid) {
    setFeedback(validation.message, "error");
    return;
  }

  setLoading(true);

  try {
    const payload = {
      email: normalizeEmail(emailInput.value),
      senha: passwordInput.value,
    };

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      setFeedback(data.message || "Login realizado com sucesso.", "success");
      if (data.token) {
        localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
        localStorage.setItem(STORAGE_USER_KEY, data.userId ?? "");
        localStorage.setItem(STORAGE_TENANT_KEY, data.tenantId ?? "");
        localStorage.setItem(STORAGE_ROLE_KEY, data.role ?? "");
      }
    window.location.href = "/processos";
    return;
    }

    if (response.status === 400 || response.status === 401) {
      setFeedback(GENERIC_MESSAGE, "error");
      return;
    }

    setFeedback(data.message || "Erro inesperado. Tente novamente.", "error");
  } catch (error) {
    console.error("[login] erro na requisição", error);
    setFeedback("Erro inesperado. Tente novamente.", "error");
  } finally {
    setLoading(false);
  }
}

if (form) {
  form.addEventListener("submit", handleSubmit);

  [emailInput, passwordInput].forEach((input) =>
    input?.addEventListener("input", () => setFeedback(""))
  );
}

