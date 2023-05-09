// const http = require('http');

// const port = process.env.PORT || 3000;

// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Hello, world!\n');
// });

// server.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });

const http = require('http');
const fs = require('fs');
const { promisify } = require('util');
const { ScrapBCA } = require('mutasi-scraper');

// Load HTML form file
const indexFile = fs.readFileSync('index.html', 'utf8');

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      const { username, password, tglawal, blnawal, tglakhir, blnakhir } = JSON.parse(body);

      const scraper = new ScrapBCA(username, password, {
        headless: false
      });

      try {
        const page = await scraper.getSettlement(tglawal, blnawal, tglakhir, blnakhir);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<pre>${page}</pre>`);
      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<pre>${err}</pre>`);
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(indexFile);
  }
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
