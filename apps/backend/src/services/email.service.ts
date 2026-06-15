import { Resend } from 'resend';
import { config } from '../config/index.js';

let resendClient: Resend | null = null;

function getApiKey(): string {
  return config.RESEND_API_KEY || config.EMAIL_API_KEY || '';
}

function getClient(): Resend {
  if (!resendClient) {
    const key = getApiKey();
    if (!key) {
      throw new Error('EMAIL_API_KEY or RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(key);
  }
  return resendClient;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ id: string } | null> {
  try {
    const to = Array.isArray(params.to) ? params.to.join(',') : params.to;
    const result = await getClient().emails.send({
      from: config.EMAIL_FROM,
      to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (result.error) {
      console.error('[EmailService] Resend error:', result.error);
      return null;
    }

    return { id: result.data?.id ?? 'unknown' };
  } catch (error) {
    console.error('[EmailService] Failed to send email:', error);
    return null;
  }
}

export function isEmailConfigured(): boolean {
  return !!getApiKey();
}
