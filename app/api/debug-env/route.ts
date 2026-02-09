import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasPerplexityKey: !!process.env.PERPLEXITY_API_KEY,
    keyLength: process.env.PERPLEXITY_API_KEY?.length || 0,
    keyPrefix: process.env.PERPLEXITY_API_KEY?.substring(0, 10) || 'not found',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('PERPLEXITY') || key.includes('MONGODB') || key.includes('JWT')),
  })
}
