import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve("frontend/dist/public");
const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? "23350");
const apiPort = Number(process.env.API_PORT ?? "8081");

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".json", "application/json; charset=utf-8"],
]);

function safePath(urlPath) {
  const relativePath = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  return join(root, relativePath);
}

function serveFile(filePath, res) {
  const extension = extname(filePath);
  const contentType = contentTypes.get(extension) ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(res);
}

function proxyApi(req, res) {
  const proxyReq = http.request(
    {
      hostname: "127.0.0.1",
      port: apiPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", (error) => {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ message: "API proxy error", error: error.message }));
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end("Missing request URL");
    return;
  }

  if (req.url.startsWith("/api")) {
    proxyApi(req, res);
    return;
  }

  const pathname = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const requestedPath = safePath(pathname);
  const filePath =
    existsSync(requestedPath) && statSync(requestedPath).isFile()
      ? requestedPath
      : join(root, "index.html");

  serveFile(filePath, res);
});

server.listen(port, host, () => {
  console.log(`ExamForge preview available at http://localhost:${port}`);
  console.log(`Proxying /api to http://localhost:${apiPort}`);
});
