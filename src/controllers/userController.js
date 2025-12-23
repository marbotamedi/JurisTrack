import {
  createUser,
  inactivateUser,
  listUsers,
  reactivateUser,
  updateUser,
} from "../services/userService.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/authErrors.js";
import { logError, logWarn } from "../utils/logger.js";

function handleError(res, error, context = {}) {
  if (error instanceof ValidationError || error instanceof ConflictError) {
    logWarn("users.request.invalid", error.message, context);
    const status = error instanceof ConflictError ? 400 : error.status ?? 400;
    return res.status(status).json({ message: error.message });
  }

  if (error instanceof NotFoundError) {
    logWarn("users.request.not_found", error.message, context);
    return res.status(404).json({ message: error.message });
  }

  logError("users.request.error", "Erro interno", { ...context, error });
  return res.status(500).json({ message: "Erro interno" });
}

export const listUsersController = async (req, res) => {
  try {
    const { tenantId, status } = req.query || {};
    const users = await listUsers({ tenantId, status });
    return res.status(200).json(users);
  } catch (error) {
    return handleError(res, error, { tenantId: req.query?.tenantId, status: req.query?.status });
  }
};

export const createUserController = async (req, res) => {
  try {
    const { email, password, role, tenantId, status } = req.body || {};
    const result = await createUser({ email, password, role, tenantId, status });
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error, { email: req.body?.email, tenantId: req.body?.tenantId });
  }
};

export const updateUserController = async (req, res) => {
  try {
    const { id } = req.params || {};
    const { role, status, password, email, tenantId } = req.body || {};
    const result = await updateUser(id, { role, status, password, email, tenantId });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, { id: req.params?.id, tenantId: req.body?.tenantId });
  }
};

export const inactivateUserController = async (req, res) => {
  try {
    const { id } = req.params || {};
    const result = await inactivateUser(id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, { id: req.params?.id });
  }
};

export const reactivateUserController = async (req, res) => {
  try {
    const { id } = req.params || {};
    const result = await reactivateUser(id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, { id: req.params?.id });
  }
};

