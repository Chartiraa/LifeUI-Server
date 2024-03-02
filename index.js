import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { ROSMessages } from "./modules/ROSSubscriber.js";
import { Server } from "socket.io"
import { createServer } from "node:http"


const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.get("/", (req, res) => {
  if (ROSMessages() == '{}') {
    res.send("Back-end çalıştııııı!");
  }
  else {
    console.log(ROSMessages())
    res.send(ROSMessages())
  }
})

app.post('/', (req, res) => {
  const requestData = req.body;
  console.log('Gelen Veri:', requestData);

  res.json({ message: 'İstek başarılı, veri alındı.' });
});

server.listen(port, () => {
  console.log("Server ayağa kalktı")
})

io.on('connection', (socket) => {
  console.log('user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

