const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next') && !file.includes('dist') && !file.includes('build')) {
        results = results.concat(walk(file));
      }
    } else {
        results.push(file);
    }
  });
  return results;
}

const files = walk('.');
let c = 0;
files.forEach(f => {
  try {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('KSOHTC')) {
      const newContent = content.replace(/KSOHTC/g, 'KSOSHTC');
      fs.writeFileSync(f, newContent, 'utf8');
      c++;
      console.log('Updated ' + f);
    }
  } catch(e) {}
});
console.log('Total files updated: ' + c);
