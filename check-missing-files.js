const fs = require('fs');
const path = require('path');

function checkMissingFiles() {
  const componentsDir = path.join(__dirname, 'src', 'app', 'components');
  const issues = [];

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Check if there's an index.tsx file
        const indexPath = path.join(fullPath, 'index.tsx');
        if (fs.existsSync(indexPath)) {
          const indexContent = fs.readFileSync(indexPath, 'utf8');
          
          // Find all export statements
          const exportMatches = indexContent.match(/export.*from "\.\/([^"]+)"/g);
          
          if (exportMatches) {
            for (const match of exportMatches) {
              const importPath = match.match(/from "\.\/([^"]+)"/)[1];
              
              // Check if the imported file exists
              const importedFile = path.join(fullPath, `${importPath}.tsx`);
              if (!fs.existsSync(importedFile)) {
                issues.push({
                  file: indexPath,
                  importPath,
                  importedFile,
                  error: `File ${importPath}.tsx does not exist`
                });
              }
            }
          }
        }
        
        // Recursively scan subdirectories
        scanDirectory(fullPath);
      }
    }
  }

  scanDirectory(componentsDir);

  if (issues.length === 0) {
    console.log('✅ No missing file issues found!');
  } else {
    console.log(`❌ Found ${issues.length} missing file issues:`);
    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.file}`);
      console.log(`   Import: ${issue.importPath}`);
      console.log(`   Error: ${issue.error}`);
    });
  }
}

checkMissingFiles();
