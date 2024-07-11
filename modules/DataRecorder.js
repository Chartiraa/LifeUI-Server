import fs from 'fs';
import path from 'path';

export default class DataRecorder {
    constructor(directory, fileName) {
        this.directory = directory;
        this.fileName = fileName;
        this.filePath = path.join(this.directory, this.fileName);

        // Dosyanın var olup olmadığını kontrol et, yoksa oluştur
        if (!fs.existsSync(this.directory)) {
            fs.mkdirSync(this.directory, { recursive: true });
        }
    }

    _writeToFile(type, value) {
        const date = new Date();
        const formattedDate = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} -- ${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        const data = `${formattedDate} - ${type}: ${value}\n`;
        fs.appendFile(this.filePath, data, (err) => {
            if (err) {
                console.error(`Failed to write ${type} data: `, err);
            } else {
                //console.log(`${type} data recorded.`);
            }
        });
    }

    recordTemperature(value) {
        this._writeToFile('Temperature', value);
    }

    recordHumidity(value) {
        this._writeToFile('Humidity', value);
    }

    recordBattery(value) {
        this._writeToFile('Battery', value);
    }

    recordJoystick(value) {
        this._writeToFile('Joystick', JSON.stringify(value));
    }

    recordData(value) {
        this._writeToFile("", value);
    }
}