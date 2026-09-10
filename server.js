const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5177;
const TYPES = { '.jpg': 'image/jpeg', '.png': 'image/png' };

http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url !== '/') {
    const file = path.join(__dirname, path.basename(url));
    if (fs.existsSync(file)) {
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      return res.end(fs.readFileSync(file));
    }
    res.writeHead(404); return res.end('not found');
  }

  // The artifact runtime wraps bare fragments in a document; mirror that here.
  const body = fs.readFileSync(path.join(__dirname, 'page.html'), 'utf8');
  const doc = '<!doctype html><html><head><meta charset="utf8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<style>:root{color-scheme:light}body{margin:0;padding:0;'
    + 'font:14px -apple-system,BlinkMacSystemFont,sans-serif}'
    + 'img{max-width:100%}[hidden]:not([hidden=until-found]){display:none!important}</style>'
    + '</head><body>' + body + '</body></html>';
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(doc);
}).listen(PORT, () => console.log('preview on http://localhost:' + PORT));
