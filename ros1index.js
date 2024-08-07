import { Server } from "socket.io";
//import rosnodejs from 'rosnodejs';

const io = new Server({
  cors: {
    origin: "*"
  }
});

var navbarData = { temperature: 0, humidity: 0, battery: 0 };
var joystickData = { x: '0', y: '0' };

//NavbarTopics();

io.on("connection", (socket) => {
  console.log("Baglanti kuruldu - server");

  console.log(socket.id);

  socket.on("Joystick", (data) => {

    joystickData = data;
    //const nh = rosnodejs.nh;

    //let joystick = nh.advertise('/Joystick', 'std_msgs/String');
    //joystick.publish({ data: JSON.stringify(joystickData) });
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

/*function NavbarTopics() {

  rosnodejs.initNode('/UI')
    .then((rosNode) => {
      let temperature = rosNode.subscribe('/temperature', 'std_msgs/String',
        (data) => {
          //rosnodejs.log.info('Temperature: [' + data.data + ']');
          navbarData.temperature = data.data;
        }
      );

      let humidity = rosNode.subscribe('/humidity', 'std_msgs/String',
        (data) => {
          //rosnodejs.log.info('Humidity: [' + data.data + ']');
          navbarData.humidity = data.data;
        }
      );

      let battery = rosNode.subscribe('/battery', 'std_msgs/String',
        (data) => {
          //rosnodejs.log.info('Battery: [' + data.data + ']');
          navbarData.battery = data.data;
        }
      );



    });
}*/
