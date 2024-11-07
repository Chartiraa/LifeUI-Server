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
import rclnodejs from 'rclnodejs';
import sharp from "sharp";

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

async function startRosNode() {
  await rclnodejs.init();
  const node = new rclnodejs.Node("multi_camera_subscriber_node");

  // ROS 2 Publishers oluşturma
  const gpsPublisher = node.createPublisher("std_msgs/msg/String", "/robot/gps");
  const joystickPublisher = node.createPublisher("geometry_msgs/msg/Vector3", "/robot/joystick");
  const stopPublisher = node.createPublisher("std_msgs/msg/String", "/robot/stop");
  const autonomousDrivePublisher = node.createPublisher("std_msgs/msg/String", "/robot/autonomous_drive");
  const autonomousStatePublisher = node.createPublisher("std_msgs/msg/String", "/robot/autonomous_state");
  const turnTypePublisher = node.createPublisher("std_msgs/msg/String", "/robot/turn_type");
  const cameraSelectPublisher = node.createPublisher("std_msgs/msg/String", "/robot/camera_select");
  const speedFactorPublisher = node.createPublisher("std_msgs/msg/String", "/robot/speed_factor");

  io.on("connection", (socket) => {
    console.log("Bağlantı kuruldu - server");
    console.log(socket.id);

    socket.on("gps", (data) => {
      const msg = { data };
      gpsPublisher.publish(msg);
    });

    socket.on("Joystick", (data) => {
      const msg = {
        x: data.x || 0,
        y: data.y || 0,
        z: data.z || 0
      };
      joystickPublisher.publish(msg);
    });

    socket.on("Stop", () => {
      const msg = { data: "Stop" };
      stopPublisher.publish(msg);
    });

    socket.on("autonomousDrive", (data) => {
      const msg = { data };
      autonomousDrivePublisher.publish(msg);
    });

    socket.on("autonomousState", (data) => {
      const msg = { data };
      autonomousStatePublisher.publish(msg);
    });

    socket.on("turnType", (data) => {
      const msg = { data };
      turnTypePublisher.publish(msg);
    });

    socket.on("cameraSelect", (data) => {
      const msg = { data };
      cameraSelectPublisher.publish(msg);
    });

    socket.on("speedFactor", (data) => {
      const msg = { data };
      speedFactorPublisher.publish(msg);
    });
  });

  // Diğer ROS abonelik ve yayın işlemleri
  const cameraSubscription = node.createSubscription(
    "sensor_msgs/msg/Image",
    "/zed/zed_node/rgb/image_rect_color",
    async (msg) => {
      const expectedSize = msg.width * msg.height * 4;
      if (msg.data.length !== expectedSize) {
        console.error(`Beklenen boyut: ${expectedSize}, ancak gelen boyut: ${msg.data.length}`);
        return;
      }
      try {
        const buffer = Buffer.from(msg.data);
        for (let i = 0; i < buffer.length; i += 4) {
          const b = buffer[i];
          buffer[i] = buffer[i + 2];
          buffer[i + 2] = b;
        }
        const jpegBuffer = await sharp(buffer, {
          raw: { width: msg.width, height: msg.height, channels: 4 },
        })
          .removeAlpha()
          .jpeg({ quality: 70 })
          .toBuffer();
        const base64Image = jpegBuffer.toString("base64");
        const imageSrc = `data:image/jpeg;base64,${base64Image}`;
        io.emit("camera_feed", imageSrc);
      } catch (error) {
        console.error("İşlenmemiş görüntüyü işlerken hata oluştu:", error);
      }
    }
  );

  const processedImageSubscription = node.createSubscription(
    "sensor_msgs/msg/Image",
    "/zedx/processed_image",
    async (msg) => {
      const expectedSize = msg.width * msg.height * 3;
      if (msg.data.length !== expectedSize) {
        console.error(`Beklenen boyut: ${expectedSize}, ancak gelen boyut: ${msg.data.length}`);
        return;
      }
      try {
        const buffer = Buffer.from(msg.data);
        for (let i = 0; i < buffer.length; i += 3) {
          const b = buffer[i];
          buffer[i] = buffer[i + 2];
          buffer[i + 2] = b;
        }
        const jpegBuffer = await sharp(buffer, {
          raw: { width: msg.width, height: msg.height, channels: 3 },
        })
          .jpeg({ quality: 70 })
          .toBuffer();
        const base64Image = jpegBuffer.toString("base64");
        const imageSrc = `data:image/jpeg;base64,${base64Image}`;
        io.emit("processed_image_feed", imageSrc);
      } catch (error) {
        console.error("İşlenmiş görüntüyü işlerken hata oluştu:", error);
      }
    }
  );

  rclnodejs.spin(node);
}

startRosNode().catch(console.error);
io.listen(5000);
server.listen(4000, () => {
  console.log("Server is running on port 4000");
});
