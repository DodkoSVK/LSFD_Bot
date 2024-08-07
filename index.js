const { Client, IntentsBitField, PermissionsBitField, GatewayIntentBits, Events, EmbedBuilder} = require('discord.js');
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
const flags = [
    PermissionsBitField.Flags.ManageRoles,    
    PermissionsBitField.Flags.ManageNicknames,
    PermissionsBitField.Flags.ChangeNickname
];
const permissions = new PermissionsBitField(flags);

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

app.post('/register/candidate', async (req, res) => {
    console.log('🟠 Sending candidate application form'); 
    const messageJSON = req.body;
    const guild = await client.guilds.fetch(process.env.FD_DC_ID);
    const user = await guild.members.fetch(messageJSON.discordId);
    
     //console.log("Data: ", messageJSON);
    try {
        const embedMessage = new EmbedBuilder({
            color: messageJSON.color,
            title: messageJSON.title,            
            fields: [
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
                { name: 'Bezúhonný (IC)', value: messageJSON.guilty},
                { name: 'Preukazy a licencie (IC)', value: `A: ${messageJSON.licences.A}, B: ${messageJSON.licences.B}, C: ${messageJSON.licences.C}, PPL/H: ${messageJSON.licences.PPL}`},
                { name: 'Práca u IZS (IC)', value: messageJSON.izs_rp},
                { name: 'Otázky na záver', value: messageJSON.question}
            ]
        });
        const channel = client.channels.cache.get(messageJSON.channelId);
        /*await channel.send({
            embeds: [embedMessage],
            content: `<@&${messageJSON.ping.chief}> <@&${messageJSON.ping.commander}> <@&${messageJSON.ping.deputy}>`
        });*/
        /* await channel.send({
            embeds: [embedMessage]            
        }); */
        console.log('🟢 Form send success.');        
    } catch (error) {
        console.log("Error " + error);
        res.status(500).json({ error: 'Problém s odoslaním webhooku' });
    }
    try {
        console.log('🟠 Sending DM to candidate');        
        await user.send(`
:incoming_envelope:  *New Incoming E-Mail*
:outbox_tray: **from**: academy@lsfd.gov
:inbox_tray: **to**: ${messageJSON.icMail}
:open_file_folder:**Predmet**: Prihláška

Dobrý deň p. ${messageJSON.name} ${messageJSON.surname},

ďakujeme za odoslanie prihlášky do Recruitment Academy of Los Santos Fire Deparment.
Prihlášku evidujeme a o nasledujúcom postupe Vás budeme informovať.

*S pozdravom,*
*Tím Recuitment Academy LSFD*

:globe_with_meridians:: [Los Santos Fire Department](https://sites.google.com/view/ls-fire-department-/domov)
:house:: Rocford Hills

**Tento e-mail bol generovaný automaticky, prosím neodpovedajte naň.**`
          ); 
          
          
        console.log('🟢 DM send success.');  
    } catch (error) {
        console.log("Error " + error);
        res.status(500).json({ error: 'Problém s odoslaním DM správy' });
    }

    try {
        const role = guild.roles.cache.get(process.env.ZIADATEL_ROLA);
        await user.roles.add(role);
        await user.setNickname(`${messageJSON.name} ${messageJSON.surname}`);
    } catch (error) {
        console.log("Error " + error);
        res.status(500).json({ error: 'Problém s pridaním role a úpravy profilu serveru' });
    }
    res.status(200);
});

client.login(process.env.TOKEN_LIVE);
app.listen(port, () => {
    console.log(`🟢 Server running on port: ${port}.`);
});
module.exports = { client };