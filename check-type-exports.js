const fs = require('fs');
const path = require('path');

function checkTypeExports() {
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
          
          // Find type exports
          const typeExportMatches = indexContent.match(/export type \{ ([^}]+) \} from "\.\/([^"]+)"/g);
          
          if (typeExportMatches) {
            for (const match of typeExportMatches) {
              const typeName = match.match(/export type \{ ([^}]+) \}/)[1];
              const importPath = match.match(/from "\.\/([^"]+)"/)[1];
              
              // Check if the imported file exists
              const importedFile = path.join(fullPath, `${importPath}.tsx`);
              if (fs.existsSync(importedFile)) {
                const importedContent = fs.readFileSync(importedFile, 'utf8');
                
                // Check if the type is actually exported
                const interfaceMatch = importedContent.match(new RegExp(`export interface ${typeName}\\b`));
                const typeMatch = importedContent.match(new RegExp(`export type ${typeName}\\b`));
                
                if (!interfaceMatch && !typeMatch) {
                  issues.push({
                    file: indexPath,
                    typeName,
                    importPath,
                    importedFile,
                    error: `Type ${typeName} not found in ${importPath}.tsx`
                  });
                }
              } else {
                issues.push({
                  file: indexPath,
                  typeName,
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
    console.log('✅ No type export issues found!');
  } else {
    console.log(`❌ Found ${issues.length} type export issues:`);
    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.file}`);
      console.log(`   Type: ${issue.typeName}`);
      console.log(`   Import: ${issue.importPath}`);
      console.log(`   Error: ${issue.error}`);
    });
  }
}

checkTypeExports();
