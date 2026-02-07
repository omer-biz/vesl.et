import { getCollection } from "astro:content";

export default async function getLogsCollection() {
  const logs = await getCollection("logs", ({ data }) => {
    return import.meta.env.PROD ? data.draft != true : true;
  });

  return logs;
}
