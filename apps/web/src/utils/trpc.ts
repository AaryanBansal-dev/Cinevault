import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@Cinevault/api/routers/index";

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();
