export type AppError =
  | ValidationError
  | DatabaseError
  | AuthorizationError
  | NotFoundError
  | NetworkError;

export type ValidationError = {
  type: "VALIDATION";
  field: string;
  message: string;
  constraint?: string;
};

export type DatabaseError = {
  type: "DATABASE";
  operation: "insert" | "update" | "delete" | "select";
  message: string;
  code?: string;
};

export type AuthorizationError = {
  type: "UNAUTHORIZED";
  resource?: string;
};

export type NotFoundError = {
  type: "NOT_FOUND";
  resource: string;
  id: string | number;
};

export type NetworkError = {
  type: "NETWORK";
  status?: number;
  message: string;
};

export const validationError = (
  field: string,
  message: string,
  constraint?: string,
): ValidationError => ({
  type: "VALIDATION",
  field,
  message,
  constraint,
});

export const databaseError = (
  operation: DatabaseError["operation"],
  message: string,
  code?: string,
): DatabaseError => ({
  type: "DATABASE",
  operation,
  message,
  code,
});

export const authorizationError = (resource?: string): AuthorizationError => ({
  type: "UNAUTHORIZED",
  resource,
});

export const notFoundError = (
  resource: string,
  id: string | number,
): NotFoundError => ({
  type: "NOT_FOUND",
  resource,
  id,
});

export const networkError = (
  message: string,
  status?: number,
): NetworkError => ({
  type: "NETWORK",
  status,
  message,
});
