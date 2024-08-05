const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const readDatabase = require('../databaseFunctions/readDatabase');
require('dotenv').config();
const moment = require('moment-timezone');
const { okImage, warnImage, nokImage } = require('../images/images.js');
const writeDatabase = require('../databaseFunctions/writeDatabase.js');
const sendChannelEmbedMessage = require('../functions/sendChannelEmbedMessage.js');
const { client } = require('../index.js');


module.exports =  {
    data: new SlashCommandBuilder()
    .setName('prichod')
    .setDescription('Príchod do služby'),
    allowRoles: [ 
        process.env.CANDIDATE_ROLE,
	process.env.CANDIDATE_ROLE2,
        process.env.FD_ROLE
    ], 
    allowChannels: [
        process.env.ATT_CHANNEL_ID
    ],
    async execute(interaction){
        const userID = interaction.user.id;
        let query = 'SELECT * FROM lsfd_attendance WHERE emp = $1 AND arrival IS NOT NULL AND departure IS NULL;';
        let queryValues = [userID];
        let result = await readDatabase(query, queryValues);
        const reply = new EmbedBuilder()
        if(result){
            reply.setColor(0xffcc00)
                .setTitle('Dochádzkový terminál - Upozornenie')
                .setThumbnail(warnImage)
                .setDescription('Už sa nachádzaš v službe.');
            
            return interaction.reply({
                embeds: [reply],
                ephemeral: true             
            });            
        }
        query = `INSERT INTO lsfd_attendance (emp, arrival) VALUES ($1, CURRENT_TIMESTAMP) RETURNING 
                to_char(arrival::DATE, 'YYYY-MM-DD') AS DutyDay,
                to_char(arrival::TIME, 'HH24:MI:SS') AS DutyArrival;`;
        queryValues = [userID];
        result = await writeDatabase(query, queryValues);
        if(result)
        {
            const dutyDay = result.rows[0].dutyday;
            const dutyArrival = result.rows[0].dutyarrival;
            reply.setColor(0x339900)
                .setTitle('Dochádzkový terminál - Príchod')
                .setThumbnail(okImage)
                .addFields(
                    {
                        name: '**Deň a čas príchodu**',
                        value: `*${dutyDay}* o *${dutyArrival}*`
                    }                    
                )
            const chiefReply = new EmbedBuilder({
                color: 0x339900,
                title: 'Dochádzkový terminál - Príchod',
                description: `Zamestnanec <@${interaction.user.id}>`,
                thumbnail: {url: okImage},
                fields: [
                    {
                        name: '**Deň a čas príchodu**',
                        value: `*${dutyDay}* o *${dutyArrival}*`
                    }
                ]
            });
            sendChannelEmbedMessage(chiefReply,process.env.ATT_CHIEF_CHANNEL_ID, client );
            return interaction.reply({
                embeds: [reply],
                ephemeral: true             
            });          
            }
    },
};