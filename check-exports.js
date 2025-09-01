const fs = require('fs');
const path = require('path');

function checkAllExports() {
  const issues = [];
  
  // Check context exports
  const contextIndex = path.join(__dirname, 'src', 'app', 'context', 'index.ts');
  const contextContent = fs.readFileSync(contextIndex, 'utf8');
  const contextExports = contextContent.match(/export\s*{([^}]+)}/s)[1];
  const exportedItems = contextExports.split(',').map(item => item.trim());
  
  // Check what's actually exported from UnifiedContext
  const unifiedContextPath = path.join(__dirname, 'src', 'app', 'context', 'UnifiedContext.tsx');
  const unifiedContent = fs.readFileSync(unifiedContextPath, 'utf8');
  
  exportedItems.forEach(item => {
    if (!unifiedContent.includes(`export const ${item}`) && !unifiedContent.includes(`export function ${item}`)) {
      issues.push(`Context export '${item}' not found in UnifiedContext`);
    }
  });
  
  // Check atoms exports
  const atomsIndex = path.join(__dirname, 'src', 'app', 'components', 'atoms', 'index.ts');
  const atomsContent = fs.readFileSync(atomsIndex, 'utf8');
  const atomsExports = atomsContent.match(/export\s*{([^}]+)}/s)[1];
  const atomsItems = atomsExports.split(',').map(item => item.trim());
  
  console.log('Context exports:', exportedItems);
  console.log('Atoms exports:', atomsItems);
  
  if (issues.length > 0) {
    console.log('Issues found:', issues);
  } else {
    console.log('No export issues found!');
  }
}

checkAllExports();
