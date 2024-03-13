import ROSLIB from 'roslib';
import { ROSConnect } from './ROSConnect';

export default ROSMessageSender = (msgTopic, messageType, messageData) => {
  
  const ros = ROSConnect()

  const sendMsg = new ROSLIB.Topic({
    ros: ros,
    name: msgTopic,
    messageType: messageType
  });

  const message = new ROSLIB.Message({
    data: messageData
  });

  sendMsg.publish(message);

};
