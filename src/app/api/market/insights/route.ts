import { curatedMarketSignals } from "@/lib/market/catalog";

export async function GET() {
  return Response.json({ status: "curated_prototype", lastUpdated: "2026-01-15", sourceNotice: "These are manually curated signals, not live job-market statistics.", signals: curatedMarketSignals });
}
