import { Server } from "socket.io";
import rclnodejs from 'rclnodejs';
import express from "express";
import http from "http";

import { Client } from "ssh2";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

var navbarData = { temperature: 0, humidity: 0, battery: 0 };
var joystickData = { x: '0', y: '0' };

// Global node reference
let globalNode;

async function initRclNode() {
  await rclnodejs.init();
  globalNode = rclnodejs.createNode('UI_Sensor_Subcriber');

  // Subscriptions
  globalNode.createSubscription('std_msgs/msg/String', 'temperature', (msg) => {
    navbarData.temperature = msg.data;
    //console.log(`Received message: ${typeof msg}`, msg);
  });

  globalNode.createSubscription('std_msgs/msg/String', 'humidity', (msg) => {
    navbarData.humidity = msg.data;
    //console.log(`Received message: ${typeof msg}`, msg);
  });

  globalNode.createSubscription('std_msgs/msg/String', 'battery', (msg) => {
    navbarData.battery = msg.data;
    //console.log(`Received message: ${typeof msg}`, msg);
  });

  rclnodejs.spin(globalNode);
}

io.on("connection", (socket) => {
  console.log("Baglanti kuruldu - server");
  console.log(socket.id);

  socket.on("Joystick", (data) => {
    joystickData = data;

    // Publisher
    const publisher = globalNode.createPublisher('std_msgs/msg/String', 'testmsgs');
    publisher.publish({ data: JSON.stringify(joystickData) });

    console.log(data);
  });

  socket.on("Stop", () => {
    console.log("Stop");
  });

  socket.on("autonomousDrive", (data) => {
    console.log(data);
  });

  socket.on("turnType", (data) => {
    console.log(data);
  });

  socket.on("cameraSelect", (data) => {
    console.log(data);
  });

  socket.on("speedFactor", (data) => {
    console.log(data);
  });

  socket.on("status", (data) => {
    console.log(data);
  });

  socket.on('executeCommand', (command) => {
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
        }).on('data', (chunk) => {
          data += chunk;
        }).stderr.on('data', (chunk) => {
          data += chunk;
        });
      });
    }).connect({
      host: '10.116.60.146',
      port: 22,
      username: 'csa',
      password: '236541'
    });
  });
});

setInterval(() => {
  io.emit("Navbar", navbarData);
}, 1000);

io.listen(5000);

server.listen(4000, () => {
  console.log("Server is running on port 5000");
});

// Initialize ROS 2 node
initRclNode().catch((err) => {
  console.error('Failed to initialize ROS 2 node:', err);
});
