import { z } from "../../libs/zod.ts";

export const metadataSchema = z.object({
  api_key: z.string(),
});
