import { HomeClient } from "@/components/HomeClient";
import { decodeConfig } from "@/lib/quiz";
import { randomSeed } from "@/lib/random";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0] !== undefined) params.set(key, value[0]);
  }
  // Seeding on the server keeps the first render identical on both sides while
  // still giving every fresh visit a different draw.
  if (!params.has("seed")) params.set("seed", String(randomSeed()));

  return <HomeClient initialConfig={decodeConfig(params)} />;
}
