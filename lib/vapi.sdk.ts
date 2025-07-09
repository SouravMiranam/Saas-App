// lib/vapi.sdk.ts
import Vapi from '@vapi-ai/web'

let vapiInstance: Vapi | null = null

export const getVapiInstance = () => {
  if (typeof window === 'undefined') {
    throw new Error('Vapi must be used in the browser.')
  }

  if (!vapiInstance) {
    const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN
    if (!token) throw new Error('NEXT_PUBLIC_VAPI_WEB_TOKEN is missing')
    vapiInstance = new Vapi(token)
  }

  return vapiInstance
}


