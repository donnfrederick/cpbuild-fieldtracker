import * as fs from 'fs';
import * as path from 'path';

const fileToProcess = path.join(__dirname, 'service-proxies.ts');
const baseClientImportLine = `import { BaseServiceProxy } from './base-service-proxy';`;
const customFetchImportLine = `import { customFetch } from './custom-fetch';`;
const fetchAssignmentLine = `globalThis.fetch = customFetch;`;

function processFile(filePath: any) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Insert BaseServiceProxy import if missing
  if (!content.includes(baseClientImportLine)) {
    let insertIndex = 0;
    if (lines[0].startsWith('"use strict"') || lines[0].startsWith("'use strict'")) {
      insertIndex = 1;
    }
    lines.splice(insertIndex, 0, baseClientImportLine);
    console.log(`Inserted BaseServiceProxy import in: ${filePath}`);
  } else {
    console.log(`Skipped BaseServiceProxy import (already exists): ${filePath}`);
  }

  // Append customFetch import and global assignment if missing
  if (!content.includes(customFetchImportLine) && !content.includes(fetchAssignmentLine)) {
    lines.push('');
    lines.push(customFetchImportLine);
    lines.push('// Required for "useCustomFetchImplementation": true');
    lines.push(fetchAssignmentLine);
    console.log(`Appended customFetch import and fetch override in: ${filePath}`);
  } else {
    console.log(`Skipped customFetch block (already exists): ${filePath}`);
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Done processing the file.');
}

processFile(fileToProcess);
