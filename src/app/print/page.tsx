import { decodeConfig } from "@/lib/quiz";
import { PrintClient } from "./PrintClient";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0] !== undefined) params.set(key, value[0]);
  }
  return <PrintClient config={decodeConfig(params)} />;
}
