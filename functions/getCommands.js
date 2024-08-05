const { Collection } = require('discord.js');
const path = require('node:path');
const getFiles = require('./getFiles');

module.exports = (directory) => {
    let commands = new Collection();
    const commandFiles = getFiles(directory); 
    console.log("Command files:", commandFiles); // Logovanie cesty k súborom

    for (const commandFile of commandFiles) {
        const command = require(commandFile);     
        commands.set(command.data.toJSON().name, command);
    }
    return commands;
};
