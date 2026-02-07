const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("myshop backend is live");
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log("Server running on port", port);
});
