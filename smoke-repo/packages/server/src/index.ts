import { Hono } from 'hono';
import { formatGreeting } from '@smoke-repo/shared';

export const app = new Hono();

app.get('/greeting/:name', (c) => {
  const name = c.req.param('name');

  return c.text(formatGreeting(name));
});
