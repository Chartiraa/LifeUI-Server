import { Server } from "socket.io";
import rclnodejs from 'rclnodejs';
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
var joystickData = { x: '0', y: '0' };

let lastMessageTime = Date.now();
const timeout = 2000; // 5 saniye

// Global node reference
let globalNode;



async function initRclNode() {
  await rclnodejs.init();
  globalNode = rclnodejs.createNode('UI_Sensor_Subcriber');

  // Subscriptions
  globalNode.createSubscription('std_msgs/msg/String', 'temperature', (msg) => {
    navbarData.temperature = msg.data;
    sensorRecorder.recordTemperature(msg.data);
    //console.log(`Received message: ${typeof msg}`, msg);
  });

  globalNode.createSubscription('std_msgs/msg/String', 'humidity', (msg) => {
    navbarData.humidity = msg.data;
    sensorRecorder.recordHumidity(msg.data);
    //console.log(`Received message: ${typeof msg}`, msg);
  });

  globalNode.createSubscription('std_msgs/msg/String', 'battery', (msg) => {
    navbarData.battery = msg.data;
    lastMessageTime = Date.now();
    sensorRecorder.recordBattery(msg.data);

    //console.log(`Received message: ${typeof msg}`, msg);
  });

  rclnodejs.spin(globalNode);
}

io.on("connection", (socket) => {
  console.log("Baglanti kuruldu - server");
  console.log(socket.id);

  socket.on("Joystick", (data) => {
    joystickData = data;
    joystickRecorder.recordJoystick(data);
    io.emit("Joystick", joystickData);

    // Publisher
    const publisher = globalNode.createPublisher('std_msgs/msg/String', 'testmsgs');
    publisher.publish({ data: JSON.stringify(joystickData) });

    console.log(data);
  });

  socket.on("Stop", () => {
    console.log("Stop");
    generalRecorder.recordData('Stop');
  });

  socket.on("autonomousDrive", (data) => {
    console.log(data);
    generalRecorder.recordData(`Autonomous Drive: ${data}`);
  });

  socket.on("autonomousState", (data) => {
    console.log(data);
    generalRecorder.recordData(`Autonomous State: ${data}`);
  });

  socket.on("turnType", (data) => {
    console.log(data);
    generalRecorder.recordData(`Turn Type: ${data}`);
  });

  socket.on("cameraSelect", (data) => {
    console.log(data);
    generalRecorder.recordData(`Camera Select: ${data}`);
  });

  socket.on("speedFactor", (data) => {
    console.log(data);
    generalRecorder.recordData(`Speed Factor: ${data}`);
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
      host: '192.168.1.19',
      port: 22,
      username: 'jetson',
      password: 'jetson'
    });
  });
});

setInterval(() => {
  //io.emit("Navbar", navbarData);
}, 1000);

setInterval(() => {
  if (Date.now() - lastMessageTime <= timeout) {
    //console.log('Connected to ROS.');
    navbarData.connection = 'Connected';
  } else {
    //console.log('No messages received. Connection might be lost.');
    navbarData.connection = 'lost';

  }
}, 1000);

io.listen(5000);

server.listen(4000, () => {
  console.log("Server is running on port 5000");
});

// Initialize ROS 2 node
initRclNode().catch((err) => {
  console.error('Failed to initialize ROS 2 node:', err);
});
