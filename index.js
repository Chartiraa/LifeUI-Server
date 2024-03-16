import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from 'fs'
import { ROSConnectionStatus, getROSMessage } from "./modules/ROSConnect.js";

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

app.listen(port, () => {
  console.log("Server ayağa kalktı")
})

ROSConnectionStatus()

const jsonContent = fs.readFileSync("data/ROSTopicNames.json", 'utf-8');
const ROSTopicNames = JSON.parse(jsonContent);

app.get("/", (req, res) => {
  ROSTopicNames.forEach((topic) => {
    console.log(getROSMessage(topic))
    console.log(topic)
  });
})

app.post('/', (req, res) => {
  const requestData = req.body;
  console.log('Gelen Veri:', requestData);

  res.json({ message: 'İstek başarılı, veri alındı.' });
});

app.post('/joystick', (req, res) => {
  const requestData = req.body;
  console.log('Joystick Vektörü:', requestData);
  res.json({ message: 'İstek başarılı, veri alındı.' });
});

app.post('/autonomousState', (req, res) => {
  const requestData = req.body;
  console.log('Otonom Sürüş:', requestData);
  res.json({ message: 'İstek başarılı, veri alındı.' });
});

app.post('/speedFactor', (req, res) => {
  const requestData = req.body;
  console.log('Hız Çarpanı:', requestData);
  res.json({ message: 'İstek başarılı, veri alındı.' });
});

app.post('/turnType', (req, res) => {
  const requestData = req.body;
  console.log('Dönüş Türü:', requestData);
  res.json({ message: 'İstek başarılı, veri alındı.' });
});


