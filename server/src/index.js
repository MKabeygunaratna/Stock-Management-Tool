require("dotenv").config();
const app = require("./app");

const requestedPort = Number(process.env.PORT || 5000);
const initialPort =
  Number.isFinite(requestedPort) && requestedPort > 0 ? requestedPort : 5000;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Trying ${nextPort}...`);
      startServer(nextPort);
      return;
    }

    console.error(error);
    process.exit(1);
  });
};

startServer(initialPort);
