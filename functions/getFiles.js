const fs = require('node:fs');
const path = require('node:path');

module.exports = (directory) => {
    console.log(`Directory: ${directory}`);
    const files = fs.readdirSync(directory, { withFileTypes: true });
    let commandFiles = [];
    console.log(`Files: ${commandFiles}`);

    for (const file of files) {
        if (file.isDirectory()) {
            commandFiles = [
                ...commandFiles,
                ...getFiles(path.join(directory, file.name))
            ];
        } else if (file.name.endsWith(".js")) {
            commandFiles.push(path.join(directory, file.name));
        }
    }
    return commandFiles;
}
