import { BaseError } from "./error-types.ts";
import * as Sentry from "../libs/sentry.ts";

function errorHandler(error: Error) {
  if (error instanceof BaseError) {
    return new Response(JSON.stringify({ msg: error.message }), {
      status: error.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  Sentry.captureException(error);
  return new Response(JSON.stringify({ msg: "error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

export { errorHandler };
