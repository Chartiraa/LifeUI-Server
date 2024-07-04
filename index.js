import { Server } from "socket.io";
import rclnodejs from 'rclnodejs';

const io = new Server({
  cors: {
    origin: "*"
  }
});

var navbarData = { temperature: 0, humidity: 0, battery: 0 };
var joystickData = { x: '0', y: '0' };

NavbarTopics();

io.on("connection", (socket) => {
  console.log("Baglanti kuruldu - server");

  console.log(socket.id);

  socket.on("Joystick", (data) => {

    joystickData = data;

      const node = rclnodejs.createNode('publisher_example_node');
      const publisher = node.createPublisher('std_msgs/msg/String', 'testmsgs');
      publisher.publish({ data: JSON.stringify(joystickData) });
      rclnodejs.spin(node);

    console.log(data);
  })

  socket.on("Stop", () => {
    console.log("Stop");
  })

  socket.on("autonomousDrive", (data) => {
    console.log(data);
  })

  socket.on("turnType", (data) => {
    console.log(data);
  })

  socket.on("cameraSelect", (data) => {
    console.log(data);
  })

  socket.on("speedFactor", (data) => {
    console.log(data);
  })

  socket.on("autonomousState", (data) => {
    console.log(data);
  })
});


setInterval(() => {
  io.emit("Navbar", navbarData);
}, 1000);

io.listen(5000);

function NavbarTopics() {
  rclnodejs.init().then(() => {
    const node = rclnodejs.createNode('UI_Sensor_Subcriber');

    node.createSubscription('std_msgs/msg/String', 'temperature', (msg) => {
      navbarData.temperature = msg.data;
      console.log(`Received message: ${typeof msg}`, msg);
    });

    node.createSubscription('std_msgs/msg/String', 'humidity', (msg) => {
      navbarData.humidity = msg.data;
      console.log(`Received message: ${typeof msg}`, msg);
    });

    node.createSubscription('std_msgs/msg/String', 'battery', (msg) => {
      navbarData.battery = msg.data;
      console.log(`Received message: ${typeof msg}`, msg);
    });

    rclnodejs.spin(node);
  });
}
