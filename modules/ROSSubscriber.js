import ROSLIB from 'roslib';

export const getROSMessage = (topic) => {

    const ros = new ROSLIB.Ros({
        url: 'ws://localhost:9090'
    });

    console.log(topic.name)
    console.log(topic.message_type)

    const connect = new ROSLIB.Topic({
        ros,
        name: topic.name,
        messageType: topic.message_type,
    });

    connect.subscribe((message) => {
        console.log(message)
        console.log("message")
        return message
    });

}