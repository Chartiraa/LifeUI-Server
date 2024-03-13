import ROSLIB from 'roslib';
import { ROSConnect } from './ROSConnect';

export const ROSMessages = () => {

    const ros = ROSConnect()

    const jsonContent = fs.readFileSync("./data/ROSTopicNames.json", 'utf-8');
    const ROSTopicNames = JSON.parse(jsonContent);
    const messages = {}

    ROSTopicNames.forEach((name, message_type) => {

        const connect = new ROSLIB.Topic({
            ros,
            name: name,
            messageType: message_type,
        });

        connect.subscribe((message) => {
            console.log(message)
            console.log("message")

            messages.push({ name: name, message: message });
        });

    });

    return JSON.stringify(messages)

}

