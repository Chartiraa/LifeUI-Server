import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { ROSMessages } from "./modules/ROSSubscriber.js";

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

app.listen(port, () => {
  console.log("Server ayağa kalktı")
})


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


