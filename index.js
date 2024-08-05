import { Server } from "socket.io";
import express from "express";
import http from "http";
import DataRecorder from './modules/DataRecorder.js';

import { Client } from "ssh2";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const date = new Date();
const formattedDate = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} -- ${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

const sensorRecorder = new DataRecorder(`./logs/${formattedDate}`, 'SensorData.txt')
const joystickRecorder = new DataRecorder(`./logs/${formattedDate}`, 'JoystickData.txt')
const generalRecorder = new DataRecorder(`./logs/${formattedDate}`, 'GeneralData.txt')

var navbarData = { temperature: 0, humidity: 0, battery: 0, connection: 'waiting...' };
var speedF = 30;
var joystickData = { x: '0', y: '0', z: '0' };

let lastMessageTime = Date.now();
const timeout = 2000; // 5 saniye


io.on("connection", (socket) => {
  console.log("Baglanti kuruldu - server");
  console.log(socket.id);

  socket.on("Joystick", (data) => {
    if (data.x !== undefined && data.x !== null){
      joystickData.x = data.x
    }
    if (data.y !== undefined && data.y !== null){
      joystickData.y = data.y
    }
    if (data.z !== undefined && data.z !== null){
      joystickData.z = data.z
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
  console.log("Server is running on port 5000");
});
