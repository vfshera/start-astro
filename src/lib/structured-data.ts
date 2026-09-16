import type { Graph } from "schema-dts";
import type { StructuredData } from "~/types";

export type CreateStructuredDataOptions = {
  name: string;
  url: URL;
  data?: StructuredData[];
};

export function hasType(
  entity: StructuredData,
  type: StructuredData["@type"],
): boolean {
  const entityType = entity["@type"];

  if (!entityType) {
    return false;
  }

  return Array.isArray(entityType)
    ? entityType.includes(type)
    : entityType === type;
}
export function createStructuredData({
  url,
  name,
  data = [],
}: CreateStructuredDataOptions): Graph {
  const entities = [...data];

  if (!entities.some((e) => hasType(e, "Organization"))) {
    entities.unshift({
      "@type": "Organization",
      "@id": `${url.origin}/#organization`,
      name,
      url: url.origin,
    });
  }

  if (!entities.some((e) => hasType(e, "WebSite"))) {
    entities.unshift({
      "@type": "WebSite",
      "@id": `${url.origin}/#website`,
      name,
      url: url.origin,
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": entities,
  };
}
