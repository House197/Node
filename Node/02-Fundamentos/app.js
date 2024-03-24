const fs = require('fs');

const data = fs.readFileSync('README.md', 'utf8');

const newData = data.replace(/React/ig, 'Angular');

fs.writeFileSync('README-Angular.md', newData); // Crear nuevo archivo con modificaciones.
console.log(data); // Leer archivo original.