import { NextResponse } from 'next/server'
import { getTopAssets } from '@/lib/coingecko'
import { scoreAssets } from '@/lib/momentum'

export async function GET() {
  try {
    const data = scoreAssets(await getTopAssets())
    return NextResponse.json({ data, ts: Date.now() })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}