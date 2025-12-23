import { ValidationError } from "../utils/authErrors.js";
import { assertEmail } from "../utils/authUtils.js";
import { logError, logWarn } from "../utils/logger.js";
import { login, messages } from "../services/authService.js";

export const loginController = async (req, res) => {
  try {
    const { email, senha } = req.body || {};

    const emailValido = assertEmail(email);
    if (!senha) {
      throw new ValidationError("Senha é obrigatória.");
    }

    const result = await login({ email: emailValido, senha });

    if (!result.ok) {
      return res.status(401).json({ message: messages.genericAuth });
    }

    return res.status(200).json({
      userId: result.userId,
      tenantId: result.tenantId,
      role: result.role,
      token: result.token,
      message: messages.success,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      logWarn("auth.login.validation", error.message, {
        email: req.body?.email,
      });
      return res.status(400).json({ message: "Parâmetros inválidos" });
    }

    logError("auth.login.error", "Erro interno no login", { error });
    return res.status(500).json({ message: "Erro interno" });
  }
};

