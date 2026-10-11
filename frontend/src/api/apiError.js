import { getFriendlyErrorMessage } from "../utils/errorMessages";

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const getApiErrorMessage = (error) => getFriendlyErrorMessage(error);
