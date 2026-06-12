import morgan from 'morgan';
import type { Request, Response } from 'express';

morgan.token('request-id', (req: Request) => {
  return (req.headers['x-request-id'] as string) || 'unknown';
});

morgan.token('user-id', (req: Request) => {
  return ((req as unknown as Record<string, unknown>)['userId'] as string) || 'anonymous';
});

morgan.token('agency-id', (req: Request) => {
  return ((req as unknown as Record<string, unknown>)['agencyId'] as string) || 'none';
});

const formatFn: morgan.FormatFn<Request, Response> = (tokens, req, res) => {
  return [
    new Date().toISOString(),
    tokens['request-id']?.(req, res) ?? '-',
    tokens['user-id']?.(req, res) ?? '-',
    tokens['agency-id']?.(req, res) ?? '-',
    tokens['method']?.(req, res) ?? '-',
    tokens['url']?.(req, res) ?? '-',
    tokens['status']?.(req, res) ?? '-',
    tokens['response-time']?.(req, res) ?? '-',
    'ms',
  ].join(' ');
};

morgan.format('newsflow', formatFn);

export const requestLogger = morgan('newsflow');
