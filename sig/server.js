require("http")
  .createServer((q, s) => s.end("ok"))
  .listen(3000, "0.0.0.0");
if (process.env.HANDLE)
  process.on("SIGTERM", () => {
    console.log("bye");
    process.exit(0);
  });
