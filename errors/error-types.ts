import * as Sentry from "../libs/sentry.ts";

export class BaseError extends Error {
  constructor(public status: number, public message: string) {
    super();
  }
}

export class MethodNotAllowed extends BaseError {
  constructor(message: string = "Method not allowed") {
    super(405, message);
    Sentry.captureMessage(message, { level: "info" });
  }
}

export class Unauthorized extends BaseError {
  constructor(message: string = "Unauthorized") {
    super(401, message);
    Sentry.captureMessage(message, { level: "info" });
  }
}
