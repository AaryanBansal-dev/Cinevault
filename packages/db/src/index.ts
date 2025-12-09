import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from "./schema/auth";
import * as coreSchema from "./schema/core";

export const schema = {
    ...authSchema,
    ...coreSchema,
};

export const db = drizzle(process.env.DATABASE_URL || "", { schema });

// Re-export schemas
export * from "./schema/auth";
export * from "./schema/core";

// Re-export drizzle-orm operators for convenience
export { eq, and, or, not, sql, desc, asc, isNull, isNotNull, inArray, notInArray, like, ilike, gt, gte, lt, lte, ne, between } from "drizzle-orm";
