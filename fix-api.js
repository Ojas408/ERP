const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/services/api.ts', 'utf8');
content = content.replace(/const url = entity \? \/custom-columns\?entity=\\ : '\/custom-columns';/, "const url = entity ? `/custom-columns?entity=${entity}` : '/custom-columns';");
fs.writeFileSync('frontend/src/app/services/api.ts', content);
