const { Client, IntentsBitField, GatewayIntentBits, Events, EmbedBuilder} = require('discord.js');
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('node:path');
const getCommands = require('./functions/getCommands.js');
const deployCommands = require('./functions/deployCommands.js');
const connectDatabase = require('./databaseFunctions/connectDatabase.js');
const checkUserRoles = require('./functions/checkUserRoles.js');
const sendChannelEmbedMessage = require('./functions/sendChannelEmbedMessage.js');
const port = 3010;
const API_KEY = process.env.API
const { okImage, warnImage } = require('./images/images.js');
const checkCorrectChannel = require('./functions/checkCorrectChannel.js');
const { response } = require('express');


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});
function apiKeyMiddleware(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === API_KEY) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden' });
    }
}
const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(apiKeyMiddleware);

client.once(Events.ClientReady, async (c) => {
    console.log(`Bot ${c.user.tag} je online. 🟢`);
    client.commands = getCommands(path.join(__dirname, 'commands'));
    await deployCommands();
    //await connectDatabase()
    
});

client.on(Events.InteractionCreate, async(interaction) => {
    if(!interaction.isChatInputCommand() || !interaction.isUserSelectMenu) return;
    console.log(interaction);
    let command = client.commands.get(interaction.commandName);
    try {
        if(interaction.replied) return;
        const haveRole = await checkUserRoles(interaction, command.allowRoles);
        if(haveRole === false){
            const enoughRoleEmbedMessage = new EmbedBuilder({
                color: 0xcc3300,
                title: 'Chyba !',
                thumbnail: { url: warnImage },
                description: '**Nemáš oprávnenie na tento príkaz.**'
            });               
            return interaction.reply({
                embeds: [enoughRoleEmbedMessage],
                ephemeral: true 
            });
        }
        const correctChannel = await checkCorrectChannel(interaction, command.allowChannels)
        if(correctChannel === false){
            const badChannel = new EmbedBuilder({
                color: 0xcc3300,
                title: 'Chyba !',
                thumbnail: { url: warnImage },
                fields: [
                    {
                        name: 'Tento príkaz možno použiť iba v kanály',
                        value: `<#${command.allowChannels}>`
                    }
                ]                
            });               
            return interaction.reply({
                embeds: [badChannel],
                ephemeral: true 
            });
            
        }
            
        command.execute(interaction);
    } catch (error) {
        console.log(`Máme problém s vykonaním príkazu "${command.commandName}" s chybou: ${error} 🔴`); 
    }
});

//API from webapp
app.post('/check-user', async (req, res) => {
    console.log('🟢 Get /check-user, start checking user.');
    const { discordID } = req.body;
    if (!discordID) {
        return res.status(400).json({ error: 'Discord ID is required' });
    }

    try {        
        const user = await client.users.fetch(discordID);
        console.log('🟢 User exists.');
        res.json({ exists: user ? true : false });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }

});
app.get('/get/channels', async (req, res) => {
    console.log('🟢 Get /channels/get, start read all channels.');   
    const guild = client.guilds.cache.get(process.env.FD_DC_ID);
    if(!guild){
        console.log("🔴 Guild not found.");
        return res.status(404).send('Guild not found');
    }
    const channelsArray = [];
    guild.channels.cache.forEach(channel => {
        channelsArray.push({id: channel.id, name: channel.name});
    });
    //console.log("🟢 Channels: " + channelsArray);
    res.json(channelsArray);
});

app.post('/post/message', async (req, res) => {
    const data = req.body;
    const fields = data.fields;
    console.log(data);
    console.log(fields);
    const reply = new EmbedBuilder();
    reply.setColor(data.color)
        .setTitle(data.title)
        .setDescription(data.description)
        .setImage(data.image)
    
    fields.forEach(field => {
        reply.addFields({
            name: field.name,
            value: field.value
        });
    });
    console.log(reply);
    await sendChannelEmbedMessage(reply, data.channel, client);
    res.send(true);
});

app.post('/send/embed', async (req, res) => {
    try {
        const messageJSON = req.body;
        const embedMessage = new EmbedBuilder()
            .setColor(messageJSON.color)
            .setTitle(messageJSON.title)
            .setDescription(`<@%${messageJSON.ping.chief}> <@%${messageJSON.ping.commander}> <@%${messageJSON.json.deputy}>`)
            .addFields(
                { name: 'TESTOVANIE', value: 'NEREAGOVAT'},
                { name: 'Vek (OOC)', value: messageJSON.age},
                { name: 'Discord (OOC)', value: messageJSON.discord},
                { name: 'Hodín na RP ? (OOC)', value: messageJSON.hours},
                { name: 'Kde si RPil ? (OOC)', value: messageJSON.servers},
                { name: 'Máš skúsenosť z IZS ? (OOC)', value: messageJSON.izs},
                { name: 'Meno, Priezvisko (IC)', value: messageJSON.name + ", " + messageJSON.surname},
                { name: 'Dátum narodenia (IC)', value: messageJSON.dob},
                { name: 'Kontatný email (IC)', value: messageJSON.icMail},
                { name: 'Národnosť (IC)', value: messageJSON.nationality},
                { name: 'Bezúhonný (IC)', value: messageJSON.quilty},
                { name: 'Preukazy a licencie (IC)', value: `A: ${messageJSON.licences.A}, B: ${messageJSON.licences.B}, C: ${messageJSON.licences.C}, PPL/H: ${messageJSON.licences.PPL}`},
                { name: 'Práca u IZS (IC)', value: messageJSON.izs_rp},
                { name: 'Otázky na záver', value: messageJSON.question}
            )
        await sendChannelEmbedMessage(embedMessage, messageJSON.channelId, client);
        res.send(true);
    } catch (error) {
        
    }
})

client.login(process.env.TOKEN_LIVE);
app.listen(port, () => {
    console.log(`🟢 Server running on port: ${port}.`);
  });
module.exports = { client };