const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("myshop backend v1 is live");
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log("Server running on port", port);
});
