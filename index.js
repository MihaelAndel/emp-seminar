const fs = require('fs');
const parseXMLString = require('xml2js').parseStringPromise;
const moment = require('moment');

if (process.argv.length <= 2) {
    console.log('Wrong number of arguments!');
    exit(1);
}

const filePath = process.argv[2];
const timeRegex = /^\d\d:\d\d:\d\d$/;

let rootElement = '';

fs.readFile(filePath, async (error, data) => {
    if (!error) {
        const fileName = filePath.split('.xml')[0];
        const parsedData = await parseXMLString(data);
        rootElement = Object.keys(parsedData)[0];
        let xsdData = '<?xml version="1.0"?>\n<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">\n\n';
        xsdData += objectToXsd(parsedData);
        xsdData += '</xs:schema>';
        fs.writeFile(fileName + '.xsd', xsdData, (error) => {
            if (!error) {
                console.log('XSD file successfully created!');
            }
        });
    }
});

const objectToXsd = (data) => {
    let parsedString = '';
    for (const key in data) {
        const current = key === rootElement ? data[key] : data[key][0];
        if (typeof current === 'object' && current !== null) { // check for object
            parsedString += `<xs:element name="${key}">\n`;
            parsedString += '<xs:complexType>\n<xs:sequence>\n'
            parsedString += objectToXsd(current);
            parsedString += '</xs:sequence>\n</xs:complexType>\n'
            parsedString += `</xs:element>\n`;
        }
        else {
            if (!isNaN(current)) { //check for numeric
                if (current.indexOf('.') > -1) {
                    parsedString += decimalToXsd(key);
                } else {
                    parsedString += intToXsd(key);
                }
            }
            else if (moment(current).isValid()) { //check for date
                console.log(key + ' => date');
                parsedString += dateToXsd(key);
            } else if (timeRegex.test(current)) {
                parsedString += timeToXsd(key);
            }
            else { // value is string
                parsedString += stringToXsd(key);
            }
        }
    }
    return parsedString;
}

const stringToXsd = (key) => {
    const string = `<xs:element name="${key}" type="xs:string"/>\n`;
    return string;
}

const dateToXsd = (key) => {
    const string = `<xs:element name="${key}" type="xs:date"/>\n`;
    return string;
}

const intToXsd = (key) => {
    const string = `<xs:element name="${key}" type="xs:integer"/>\n`;
    return string;
}

const decimalToXsd = (key) => {
    const string = `<xs:element name="${key}" type="xs:decimal"/>\n`;
    return string;
}

const timeToXsd = (key) => {
    const string = `<xs:element name="${key}" type="xs:time"/>\n`;
    return string;
}

