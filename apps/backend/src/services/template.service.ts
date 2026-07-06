import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const currentDir = dirname(fileURLToPath(import.meta.url));

const templateCache = new Map<string, string>();

function loadTemplate(name: string): string {
  if (!templateCache.has(name)) {
    const templatePath = resolve(currentDir, '..', 'templates', `${name}.html`);
    templateCache.set(name, readFileSync(templatePath, 'utf-8'));
  }
  return templateCache.get(name)!;
}

export function renderEmailTemplate(type: string, data: Record<string, string>): string {
  const templateName = `email-${type.toLowerCase()}`;
  let html: string;
  try {
    html = loadTemplate(templateName);
  } catch {
    html = loadTemplate('email-default');
  }

  for (const [key, value] of Object.entries(data)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }

  return html;
}
