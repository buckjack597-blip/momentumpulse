export interface Asset {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_1h_in_currency: number
  price_change_percentage_24h: number
  total_volume: number
  market_cap: number
  high_24h: number
  low_24h: number
}

export interface ScoredAsset extends Asset {
  momentum_score: number
  momentum_label: 'Low' | 'Building' | 'High' | 'Extreme'
}

export function scoreAssets(assets: Asset[]): ScoredAsset[] {
  return assets.map(a => {
    const p1h = Math.abs(a.price_change_percentage_1h_in_currency ?? 0)
    const p24 = Math.abs(a.price_change_percentage_24h ?? 0)
    const volRatio = a.total_volume / (a.market_cap * 0.05 || 1)
    const volatility = ((a.high_24h - a.low_24h) / (a.current_price || 1)) * 100
    const score = Math.round(Math.min(
      Math.min(p1h * 4 + p24 * 0.8, 40) +
      Math.min(Math.max((volRatio - 0.5) * 25, 0), 40) +
      Math.min(volatility, 20), 100))
    const momentum_label = (
      score >= 75 ? 'Extreme' : score >= 50 ? 'High' : score >= 25 ? 'Building' : 'Low'
    ) as 'Low' | 'Building' | 'High' | 'Extreme'
    return { ...a, momentum_score: score, momentum_label }
  }).sort((a, b) => b.momentum_score - a.momentum_score)
}