import { createServer } from "node:http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";

const app = express();
const server = createServer(app);
const origin = ["*"];
const screens = {};

app.use(express.json());
app.use(cors({ origin, optionsSuccessStatus: 200 }));

const io = new Server(server, {
  cors: { origin, methosd: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("🟢 ONLINE CLIENT :", socket.id);

  socket.emit("screen", { screens: Object.keys(screens) });

  socket.on("screen", ({ screen, password }) => {
    if (!screen || !password)
      return socket.emit("screen", {
        error: "Screen name and password required!",
      });

    if (password !== (process.env.PASSWORD ?? "123"))
      return socket.emit("screen", { error: "Password incorrect!" });

    if (screens.hasOwnProperty(screen))
      return socket.emit("screen", { error: "This screen already busy!" });

    screens[screen] = socket;
    socket.screen = screen;

    socket.emit("screen", { success: true });
    io.emit("screen", { screens: Object.keys(screens) });
  });

  socket.on("error", (message) => {
    console.log(`🔴 ${message} :`, socket.id);
  });

  socket.on("disconnect", (message) => {
    delete screens[socket.screen];

    io.emit("screen", { screens: Object.keys(screens) });

    console.log(`🔴 ${message.toUpperCase()} :`, socket.id);
  });
});

app.post("/", async (request, response) => {
  try {
    const { screen, password, purchases } = request.body;

    if (
      request.method !== "POST" ||
      !screen ||
      !password ||
      password !== (process.env.PASSWORD ?? "123") ||
      !Array.isArray(purchases) // ||
      // !origin.includes(request.headers.origin) ||
      // !origin.includes(request.headers.referer.slice(0, -1))
    )
      return response.status(403).json("🔴 FORBIDDEN!");

    screens[screen].emit("purchases", purchases);

    return response.status(201).json("🟢 OK!");
  } catch (error) {
    console.log(error);

    return response.status(500).json("🔴 NOT OK!");
  }
});

app.post("/clear", async (request, response) => {
  try {
    const { screen, password } = request.body;

    if (
      request.method !== "POST" ||
      !screen ||
      !password ||
      password !== (process.env.PASSWORD ?? "123") // ||
      // !origin.includes(request.headers.origin) ||
      // !origin.includes(request.headers.referer.slice(0, -1))
    )
      return response.status(403).json("🔴 FORBIDDEN!");

    screens[screen].emit("clear");

    return response.status(201).json("🟢 OK!");
  } catch (error) {
    console.log(error);

    return response.status(500).json("🔴 NOT OK!");
  }
});

app.post("/screens", async (request, response) => {
  try {
    const { password } = request.body;

    if (
      request.method !== "POST" ||
      !password ||
      password !== (process.env.PASSWORD ?? "123") // ||
      // !origin.includes(request.headers.origin) ||
      // !origin.includes(request.headers.referer.slice(0, -1))
    )
      return response.status(403).json("🔴 FORBIDDEN!");

    return response.status(200).json({ screens: Object.keys(screens) });
  } catch (error) {
    console.log(error);

    return response.status(500).json("🔴 NOT OK!");
  }
});

app.get("/test", async (request, response) => {
  try {
    return screens[screen].emit("error");
  } catch (error) {
    console.log(error);

    return response.status(500).json("🔴 NOT OK!");
  }
});

server.listen(process.env.PORT ?? 8000, () => {
  console.log("SERVER :", server.address().port);
});
