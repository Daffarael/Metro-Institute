const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('e:/Metro Institute Season 2/Metro Institute Apps/frontend/src/app/(dashboard)');
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/style={{([^}]*)display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr'([^}]*)}}/g, (match, p1, p2) => {
    return `className="grid-cols-2" style={{${p1}display: 'grid'${p2}}}`;
  });

  content = content.replace(/style={{([^}]*)display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(3,\s*1fr\)'([^}]*)}}/g, (match, p1, p2) => {
    return `className="grid-cols-3" style={{${p1}display: 'grid'${p2}}}`;
  });

  content = content.replace(/style={{([^}]*)display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(4,\s*1fr\)'([^}]*)}}/g, (match, p1, p2) => {
    return `className="grid-cols-4" style={{${p1}display: 'grid'${p2}}}`;
  });

  content = content.replace(/style={{([^}]*)display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(4,1fr\)'([^}]*)}}/g, (match, p1, p2) => {
    return `className="grid-cols-4" style={{${p1}display: 'grid'${p2}}}`;
  });
  
  content = content.replace(/style={{([^}]*)display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr 1fr'([^}]*)}}/g, (match, p1, p2) => {
    return `className="grid-cols-3" style={{${p1}display: 'grid'${p2}}}`;
  });
  
  content = content.replace(/style={{([^}]*)display:\s*'grid',\s*gridTemplateColumns:\s*'320px 1fr'([^}]*)}}/g, (match, p1, p2) => {
    return `className="grid-sidebar-left" style={{${p1}display: 'grid'${p2}}}`;
  });

  content = content.replace(/style={{([^}]*)display:\s*'grid',\s*gridTemplateColumns:\s*'200px 1fr'([^}]*)}}/g, (match, p1, p2) => {
    return `className="grid-sidebar-left" style={{${p1}display: 'grid'${p2}}}`;
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Modified:', file);
    modifiedCount++;
  }
});
console.log('Total files modified:', modifiedCount);
