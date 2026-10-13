// Builds the published site into _site/ (run by .github/workflows/pages.yml).
// index.html stays the only source: every app/page gets its own folder with a copy of it
// (/visualize/index.html ...), whose <title>, description, canonical and og: tags come from
// the "ybk-seo" table inside index.html. 404.html is a copy too, so old or unknown addresses
// still open the site (the router in index.html moves them to the right page).
// Add a page: add it to ROUTES and to the ybk-seo table in index.html; nothing to change here.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, '_site');
const SKIP = new Set(['.git', '.github', '_site', 'tools', 'node_modules', '_preview', 'server.js', '.gitignore']);

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const name of fs.readdirSync(root)) {
  if (SKIP.has(name) || name === 'index.html') continue;
  fs.cpSync(path.join(root, name), path.join(out, name), { recursive: true });
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const seo = JSON.parse(html.match(/<script type="application\/json" id="ybk-seo">([\s\S]*?)<\/script>/)[1]);
const esc = t => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function page(entry, extra) {
  const url = 'https://ybkaudio.com' + entry.path;
  const block = '<!-- seo:start -->\n' +
    '<meta name="description" content="' + esc(entry.desc) + '">\n' +
    (extra || '<link rel="canonical" href="' + url + '">\n') +
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:site_name" content="YBK Audio">\n' +
    '<meta property="og:url" content="' + url + '">\n' +
    '<meta property="og:title" content="' + esc(entry.title) + '">\n' +
    '<meta property="og:description" content="' + esc(entry.desc) + '">\n' +
    '<!-- seo:end -->';
  const r = html.replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->/, block)
                .replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(entry.title) + '</title>');
  if (r === html && entry.path !== '/') throw new Error('seo block not found');
  return r;
}

const paths = [];
for (const key of Object.keys(seo)) {
  const e = seo[key];
  const dir = path.join(out, e.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(e));
  paths.push(e.path);
}
fs.writeFileSync(path.join(out, '404.html'), page(seo.home, '<meta name="robots" content="noindex">\n'));

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(out, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  paths.map(p => '  <url><loc>https://ybkaudio.com' + p + '</loc><lastmod>' + today + '</lastmod></url>').join('\n') +
  '\n</urlset>\n');
console.log('built', paths.length, 'pages + 404.html + sitemap.xml');
