import ROSLIB from 'roslib';
import fs from "fs"

const ros = new ROSLIB.Ros({
    url: 'ws://localhost:9090'
});
/*
ros.on('connection', () => {
    console.log('Connected');
});

ros.on('error', (error) => {
    console.log('Connection Error', error);
});

ros.on('close', () => {
    console.log('Closed');
});*/


export const ROSMessages = () => {

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

