'use client'
import { useEffect, useState, useCallback } from 'react'

interface Asset {
  id: string; name: string; symbol: string
  current_price: number
  price_change_percentage_1h_in_currency: number
  price_change_percentage_24h: number
  total_volume: number
  momentum_score: number
  momentum_label: string
}

const PILL: Record<string, string> = {
  Extreme: 'bg-red-950 text-red-400 border border-red-800',
  High:    'bg-amber-950 text-amber-400 border border-amber-800',
  Building:'bg-blue-950 text-blue-400 border border-blue-800',
  Low:     'bg-zinc-900 text-zinc-600 border border-zinc-800',
}

const BAR: Record<string, string> = {
  Extreme:'#ef4444', High:'#f59e0b', Building:'#3b82f6', Low:'#52525b'
}

function Pct({ v }: { v: number }) {
  const c = v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-zinc-500'
  return <span className={c}>{v > 0 ? '+' : ''}{v?.toFixed(2) ?? '—'}%</span>
}

function fmtP(n: number) {
  return n >= 1000 ? '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : n >= 1 ? '$' + n.toFixed(4) : '$' + n.toFixed(6)
}

function fmtV(n: number) {
  return n >= 1e9 ? '$' + (n/1e9).toFixed(1) + 'B'
    : n >= 1e6 ? '$' + (n/1e6).toFixed(1) + 'M' : '$' + n.toLocaleString()
}

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [watch, setWatch] = useState(new Set(['bitcoin','ethereum','solana']))

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/scanner')
      const j = await r.json()
      setAssets(j.data ?? [])
      setUpdated(new Date().toLocaleTimeString())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  const rows = assets.filter(a => {
    const q = search.toLowerCase()
    const ms = !q || a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q)
    const mf = filter === 'all' ? true
      : filter === 'extreme' ? a.momentum_label === 'Extreme'
      : filter === 'high' ? ['Extreme','High'].includes(a.momentum_label)
      : watch.has(a.id)
    return ms && mf
  })

  const tog = (id: string) =>
    setWatch(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s })

  return (
    <div className="min-h-screen bg-black text-zinc-200" style={{fontFamily:'monospace'}}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xl font-bold tracking-widest text-white">
              MOMENTUM<span className="text-amber-400">PULSE</span>
            </div>
            <div className="text-xs text-zinc-600 mt-1">real-time crypto momentum scanner</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"/>
            {loading ? 'loading…' : `updated ${updated}`}
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap items-center">
          {['all','extreme','high','watchlist'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs border transition-colors cursor-pointer ${
                filter === f ? 'border-amber-600 text-amber-400 bg-amber-950'
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
              {f}
            </button>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="search…"
            className="ml-auto bg-zinc-950 border border-zinc-800 rounded px-3 py-1 text-xs text-zinc-300 outline-none w-36"/>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-900">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-900 text-zinc-600 text-[10px] uppercase tracking-wider">
                {['#','asset','price','1h','24h','volume','momentum',''].map((h,i) => (
                  <th key={i} className={`px-4 py-3 ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center py-20 text-zinc-600">loading market data…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={8} className="text-center py-20 text-zinc-600">no assets match</td></tr>}
              {rows.map((a, i) => (
                <tr key={a.id} className="border-b border-zinc-900 hover:bg-zinc-950 transition-colors">
                  <td className="px-4 py-3 text-zinc-700">{i+1}</td>
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{a.name}</div>
                    <div className="text-zinc-600 text-[10px] uppercase">{a.symbol}</div>
                  </td>
                  <td className="px-4 py-3 text-right">{fmtP(a.current_price)}</td>
                  <td className="px-4 py-3 text-right"><Pct v={a.price_change_percentage_1h_in_currency}/></td>
                  <td className="px-4 py-3 text-right"><Pct v={a.price_change_percentage_24h}/></td>
                  <td className="px-4 py-3 text-right text-zinc-500">{fmtV(a.total_volume)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 h-1 rounded bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded" style={{
                          width: `${a.momentum_score}%`,
                          background: BAR[a.momentum_label]
                        }}/>
                      </div>
                      <span className="w-6 text-right">{a.momentum_score}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${PILL[a.momentum_label]}`}>
                        {a.momentum_label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => tog(a.id)}
                      className={`cursor-pointer transition-colors ${watch.has(a.id) ? 'text-amber-400' : 'text-zinc-700 hover:text-zinc-500'}`}>
                      ★
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-[10px] text-zinc-700 flex justify-between">
          <span>data: coingecko · auto-refreshes every 30s · not financial advice</span>
          <span>{rows.length} assets shown</span>
        </div>
      </div>
    </div>
  )
}