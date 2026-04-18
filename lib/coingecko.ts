import { Asset } from './momentum'

let cache: { data: Asset[], ts: number } | null = null

export async function getTopAssets(): Promise<Asset[]> {
  if (cache && Date.now() - cache.ts < 30000) return cache.data
  const res = await fetch(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=1h,24h'
  )
  if (!res.ok) throw new Error('CoinGecko fetch failed')
  const data: Asset[] = await res.json()
  cache = { data, ts: Date.now() }
  return data
}