const { ncp } = require('ncp');
const path = require('path');
const fs = require('fs');

ncp.limit = 16;

// Read the api directory
const apiDirectory = path.join(__dirname, '..');
const directories = fs.readdirSync(apiDirectory, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

directories.forEach(functionDirectory => {
  const source = path.join(apiDirectory, functionDirectory);
  const destination = path.join(apiDirectory, 'dist', functionDirectory);

  // Check if function.json exists in the source directory
  if (fs.existsSync(path.join(source, 'function.json'))) {
    // Filter out specific files while copying
    const filterFunction = function (source) {
      const fileExtension = path.extname(source).toLowerCase();
      const fileName = path.basename(source).toLowerCase();

      // Exclude sample.dat file
      if (fileName === 'sample.dat') {
        return false;
      }

      // Exclude TypeScript files
      if (fileExtension === '.ts') {
        return false;
      }

      return true;
    };

    ncp(source, destination, { filter: filterFunction }, function (err) {
      if (err) {
        return console.error(err);
      }
      console.log('Done copying for:', functionDirectory);
    });
  }
});
