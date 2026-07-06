import { config } from '../config/index.js';

let twilioClient: {
  messages: { create: (args: { from: string; to: string; body: string }) => Promise<unknown> };
} | null = null;

async function getClient() {
  if (!twilioClient) {
    const twilio = await import('twilio');
    twilioClient = twilio.default(
      config.WHATSAPP_ACCOUNT_SID ?? '',
      config.WHATSAPP_AUTH_TOKEN ?? ''
    );
  }
  return twilioClient;
}

export interface SendWhatsAppParams {
  to: string;
  message: string;
}

export async function sendWhatsApp(params: SendWhatsAppParams): Promise<{ sid: string } | null> {
  try {
    if (!isWhatsAppConfigured()) {
      console.warn('[WhatsAppService] Twilio not configured');
      return null;
    }

    const client = await getClient();
    const fromNumber = config.WHATSAPP_FROM_NUMBER!;

    const result = (await client.messages.create({
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${params.to}`,
      body: params.message,
    })) as { sid: string };

    console.log(`[WhatsAppService] Message sent to ${params.to}: ${result.sid}`);
    return { sid: result.sid };
  } catch (error) {
    console.error('[WhatsAppService] Failed to send WhatsApp:', error);
    return null;
  }
}

export function isWhatsAppConfigured(): boolean {
  return !!(
    config.WHATSAPP_PROVIDER === 'twilio' &&
    config.WHATSAPP_ACCOUNT_SID &&
    config.WHATSAPP_AUTH_TOKEN &&
    config.WHATSAPP_FROM_NUMBER
  );
}
