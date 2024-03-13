import ROSLIB from 'roslib';
import fs from 'fs'

export const ROSConnect = () => {

    var rosStatus = false

    const logsPath = '../../Logs/Logs - ' + Date.UTC.toString
    
    const ros = new ROSLIB.Ros({
        url: 'ws://localhost:9090'
    });
    
    while (rosStatus == false) {
        ros.on('connection', () => {
            console.log('Connected')
            rosStatus = true
        });
        
        ros.on('error', (error) => {
            console.log('Connection Error', error)
        });
    }
    
    if (rosStatus == true){
        fs.mkdir(logsPath)
        fs.mkdir(logsPath + '/Camera')
        fs.mkdir(logsPath + '/Weed Data')
        fs.mkdir(logsPath + '/Weed Data/Weed Pictures')
    }

    return ros

}
