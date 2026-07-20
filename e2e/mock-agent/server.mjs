import { createServer } from 'node:http';

const PORT = process.env.PORT || 5002;

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { resolve({}); }
    });
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  if (method === 'GET' && path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
    return;
  }

  if (method === 'GET' && path === '/threads') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('[]');
    return;
  }

  if (method === 'POST' && path === '/threads') {
    const body = await parseBody(req);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      thread_id: body.threadId || `thread-${Date.now()}`,
      metadata: body.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    return;
  }

  const streamMatch = path.match(/^\/threads\/([^/]+)\/runs\/stream$/);
  if (method === 'POST' && streamMatch) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    const runId = `run-${Date.now()}`;
    const msgId = `msg-${Date.now()}`;
    const reply = 'Hello from the mock agent! Your session is working correctly.';
    const words = reply.split(' ');

    const events = [
      `event: metadata\ndata: {"run_id":"${runId}"}\n\n`,
      ...words.map((_word, i) => {
        const partial = words.slice(0, i + 1).join(' ');
        return `event: messages/partial\ndata: ${JSON.stringify([{ type: 'ai', content: partial, id: msgId }])}\n\n`;
      }),
      `event: messages/complete\ndata: ${JSON.stringify([{ type: 'ai', content: reply, id: msgId }])}\n\n`,
      `event: end\ndata: null\n\n`,
    ];

    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= events.length || res.destroyed) {
        clearInterval(interval);
        if (!res.destroyed) res.end();
        return;
      }
      res.write(events[idx]);
      idx++;
    }, 50);

    req.on('close', () => clearInterval(interval));
    return;
  }

  const stateMatch = path.match(/^\/threads\/([^/]+)\/state$/);
  if (method === 'GET' && stateMatch) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      values: { messages: [] },
      tasks: [],
      next: [],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    return;
  }

  if (method === 'POST' && path === '/feedback') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock agent listening on port ${PORT}`);
});
