const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('assets/final (7).pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('scratch/pdf_text.txt', data.text);
    console.log('Number of pages:', data.numpages);
    console.log('Text extracted and saved to scratch/pdf_text.txt');
}).catch(function(error){
    console.error('Error:', error);
});
