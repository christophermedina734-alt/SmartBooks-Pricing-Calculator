const http = require("http");
const fs = require("fs");
const path = require("path");

const preferredPort = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, "public");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  const safePath = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");
  const requestedPath = safePath === "" ? "index.html" : safePath;
  const filePath = path.normalize(path.join(publicDir, requestedPath));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && preferredPort === 3000) {
    server.listen(3001, "0.0.0.0", () => {
      console.log("SmartBooks CPA calculator running at http://localhost:3001");
    });
    return;
  }

  throw error;
});

server.listen(preferredPort, "0.0.0.0", () => {
  console.log(`SmartBooks CPA calculator running at http://localhost:${preferredPort}`);
});
