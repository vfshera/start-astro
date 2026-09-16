import type { Thing } from "schema-dts";

export type StructuredData = Exclude<Thing, string>;
