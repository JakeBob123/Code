const http = require('http');

/**
 * The bot has no reason to serve HTTP on its own — but Render's free tier
 * only offers Web Services (which must bind $PORT and answer requests),
 * not Background Workers, which cost money on every plan. This tiny
 * server exists purely so the bot process qualifies as a free Web Service
 * and gives an uptime pinger (or Render's own health check) something to
 * hit. It does nothing else — no routes, no auth, nothing sensitive.
 */
function startHealthServer(getStatus) {
  const port = process.env.PORT || 3000;
  const server = http.createServer((req, res) => {
    const status = getStatus();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, ...status }));
  });
  server.listen(port, () => {
    console.log(`[bot] health server listening on :${port} (for Render/uptime pings only)`);
  });
  return server;
}

module.exports = { startHealthServer };
