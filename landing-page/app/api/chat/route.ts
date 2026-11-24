import { NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/utils/api'

/**
 * Legacy path kept as a thin proxy so older clients that still call
 * /api/chat keep working. New code hits Express /api/v1/public/chat.
 * Remove this file when landing is static-exported to S3/Amplify.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const upstream = await fetch(`${getApiBaseUrl()}/public/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    })
    const data = await upstream.json().catch(() => ({}))
    return NextResponse.json(data, {
      status: upstream.status,
      headers: upstream.headers.get('Retry-After')
        ? { 'Retry-After': upstream.headers.get('Retry-After') as string }
        : undefined,
    })
  } catch (error) {
    console.error('Chat proxy error:', error)
    return NextResponse.json(
      {
        reply:
          'Welcome to House & Sky Real Estate Advisory. Leave your phone number to receive our latest luxury property price sheet directly on WhatsApp!',
        properties: [],
        leadCaptured: false,
        showLeadForm: true,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
