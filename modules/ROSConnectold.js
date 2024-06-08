import ROSLIB from 'roslib';
import fs from 'fs'
import path from 'path'

const ros = new ROSLIB.Ros({
    url: 'ws://localhost:9090'
});

export function ROSConnectionStatus() {

    const currentDate = new Date();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const seconds = currentDate.getSeconds();

    const dateTime = hours + ':' + minutes + ':' + seconds + ' - ' + day + '.' + month + '.' + year

    const logsPath = path.join(process.cwd(), '../Logs/Logs - ' + dateTime);

    ros.on('connection', () => {
        console.log('ROS Bağlandı');
        
        fs.mkdir(logsPath, { recursive: true }, (err) => {
            !err ? '' : console.log(err)
        })
        fs.mkdir(logsPath + '/Camera', { recursive: true }, (err) => {
            !err ? '' : console.log(err)
        })
        fs.mkdir(logsPath + '/Weed Data/Weed Pictures', { recursive: true }, (err) => {
            !err ? '' : console.log(err)
        })

    });

    ros.on('error', (error) => {
        console.log('Connection Error', error)
    });

    ros.on('close', () => {
        console.log('Closed');
    });

}
export function getROSMessage(topic, callback) {

    const connect = new ROSLIB.Topic({
        ros,
        name: topic.name,
        messageType: topic.message_type,
    });


    connect.subscribe((message) => {
        callback(message)
    })
}