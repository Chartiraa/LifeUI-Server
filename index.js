import { Server } from "socket.io";
import express from "express";
import http from "http";
import DataRecorder from './modules/DataRecorder.js';
import ip from 'ip';
import { Client } from "ssh2";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { Subscriber } from 'zeromq';
import * as msgpack from '@msgpack/msgpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parentDir = path.resolve(__dirname, '..');
const envDir = path.join(parentDir, 'LifeUI-React');

function saveToEnvFile(key, value) {
  const envPath = path.join(envDir, '.env');
  
  let envConfig = {};
  if (fs.existsSync(envPath)) {
    envConfig = dotenv.parse(fs.readFileSync(envPath));
  }
  
  envConfig[key] = value;
  const envContent = Object.keys(envConfig).map(k => `${k}=${envConfig[k]}`).join('\n');
  fs.writeFileSync(envPath, envContent);
  console.log(`IP address: ${value}`);
}

const localIPAddress = ip.address();
saveToEnvFile('REACT_APP_LOCAL_IP_ADDRESS', `http://${localIPAddress}:5000`);

const app = express();
const server = http.createServer(app);
app.use(express.static(__dirname));

const io = new Server(server, {
  cors: { origin: "*" }
});

const zmqSocket1 = new Subscriber();
zmqSocket1.connect("tcp://192.168.1.24:5555"); 
zmqSocket1.subscribe("");

const zmqSocket2 = new Subscriber();
zmqSocket2.connect("tcp://192.168.1.24:5556"); 
zmqSocket2.subscribe("");

// İlk ZeroMQ bağlantısını dinleme (5555 portu)
(async () => {
  for await (const [msg] of zmqSocket1) {
    try {
      const data = JSON.parse(msg.toString());
      io.emit("5555", data.image);  // İlk portun verisini gönder
    } catch (error) {
      console.error("Port 5555 - Veri çözme hatası:", error);
    }
  }
})();

// İkinci ZeroMQ bağlantısını dinleme (5556 portu)
(async () => {
  for await (const [msg] of zmqSocket2) {
    try {
      const data = JSON.parse(msg.toString());
      io.emit("5556", data.image);  // İkinci portun verisini gönder
    } catch (error) {
      console.error("Port 5556 - Veri çözme hatası:", error);
    }
  }
})();

io.on("connection", (socket) => {
  console.log("Bağlantı kuruldu - server");
  console.log(socket.id);

  socket.emit("ipAddress", ip.address());

  socket.on("gps", (data) => {
    io.emit("GPS", data);
  });

  socket.on("Joystick", (data) => {
    if (data.x !== undefined && data.x !== null){
      joystickData.x = data.x;
    }
    if (data.y !== undefined && data.y !== null){
      joystickData.y = data.y;
    }
    if (data.z !== undefined && data.z !== null){
      joystickData.z = data.z;
    }

    joystickRecorder.recordJoystick(data);
    io.emit("Joystick", joystickData);

    console.log(joystickData);
  });

  socket.on("Stop", () => {
    console.log("Stop");
    io.emit("Stop", "Stop");
    generalRecorder.recordData('Stop');
  });

  socket.on("autonomousDrive", (data) => {
    console.log(data);
    io.emit("autonomousDrive", data);
    generalRecorder.recordData(`Autonomous Drive: ${data}`);
  });

  socket.on("autonomousState", (data) => {
    console.log(data);
    io.emit("autonomousState", data);
    generalRecorder.recordData(`Autonomous State: ${data}`);
  });

  socket.on("turnType", (data) => {
    generalRecorder.recordData(`Turn Type: ${data}`);
  });

  socket.on("cameraSelect", (data) => {
    console.log(data);
    io.emit("cameraSelect", data);
    generalRecorder.recordData(`Camera Select: ${data}`);
  });

  socket.on("speedFactor", (data) => {
    console.log(data);
    io.emit("speedFactor", data);
    generalRecorder.recordData(`Speed Factor: ${data}`);
  });

  socket.on("Load", (data) => {
    io.emit("LoadUI", data);
  });

  socket.on("plow", (data) => {
    console.log(data);
    io.emit("plow", data);
  });

  socket.on('executeCommand', (command) => {
    generalRecorder.recordData(`Command: ${command}`);

    const conn = new Client();
    conn.on('ready', () => {
      console.log('Client :: ready');
      conn.exec(command, (err, stream) => {
        if (err) {
          socket.emit('commandOutput', `Error: ${err.message}`);
          return;
        }
        let data = '';
        stream.on('close', (code, signal) => {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          conn.end();
          socket.emit('commandOutput', data);
          generalRecorder.recordData(`Output: ${data}`);
        }).on('data', (chunk) => {
          data += chunk;
        }).stderr.on('data', (chunk) => {
          data += chunk;
        });
      });
    }).connect({
      host: '192.168.122.171',
      port: 22,
      username: 'csa',
      password: '236541'
    });
  });
});

io.listen(5000);

server.listen(4000, () => {
  console.log("Server is running on port 4000");
});
