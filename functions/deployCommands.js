const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
require('dotenv').config();
const getCommands = require('./getCommands');

module.exports = async() => {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN_LIVE);
    const commands = getCommands(path.join(__dirname, '../commands')).map(cmd => cmd.data.toJSON()); // Načítanie príkazov a ich transformácia do JSON
    try {
        console.log('Mažem príkazy...🟡');
        const existingCommands = await rest.get(Routes.applicationGuildCommands(process.env.CLIENT_ID_LIVE, process.env.FD_DC_ID));
        
        for (const command of existingCommands) {
            await rest.delete(Routes.applicationGuildCommand(process.env.CLIENT_ID_LIVE, process.env.FD_DC_ID, command.id));
        }
        
        console.log('Registrujem príkazy...🟡');
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID_LIVE, process.env.FD_DC_ID), { body: commands });
        
        console.log('Príkazy boli úspešne zaregistrované.🟢');
    } catch (error) {
        console.error(`Oj, nastala nám chyba pri registrovaní príkazov: ${error} 🔴`);
    }
};