const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const readDatabase = require('../databaseFunctions/readDatabase');
require('dotenv').config();
const { okImage, warnImage, nokImage } = require('../images/images.js');
const writeDatabase = require('../databaseFunctions/writeDatabase.js');
const sendChannelEmbedMessage = require('../functions/sendChannelEmbedMessage.js');
const { client } = require('../index.js');

module.exports =  {
    data: new SlashCommandBuilder()
    .setName('odchod')
    .setDescription('Odchod so sluzby'),
    allowRoles: [ 
        process.env.CANDIDATE_ROLE,
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
        if(!result){
            reply.setColor(0xffcc00)
                .setTitle('Dochádzkový terminál - Upozornenie')
                .setThumbnail(warnImage)
                .setDescription('Nenachádzaš sa v službe.');
            
            return interaction.reply({
                embeds: [reply],
                ephemeral: true             
            });            
        }        
        query = `UPDATE lsfd_attendance 
SET departure = CURRENT_TIMESTAMP,
    total = (CURRENT_TIMESTAMP - arrival)::time
WHERE emp = $1 
  AND arrival IS NOT NULL 
  AND departure IS NULL 
RETURNING
    to_char(arrival::DATE, 'YYYY-MM-DD') AS DayArrival,
    to_char(arrival::TIME, 'HH24:MI:SS') AS DutyArrival,
    to_char(departure::DATE, 'YYYY-MM-DD') AS DayDeparture,
    to_char(departure::TIME, 'HH24:MI:SS') AS DutyDeparture,
    to_char(total, 'HH24:MI:SS') AS DutyTotal;
`;
        queryValues = [userID];
        result = await writeDatabase(query, queryValues);
        if(result)
        {
            const dayArrival = result.rows[0].dayarrival;
            const dutyArrival = result.rows[0].dutyarrival;
            const dayDeparture = result.rows[0].daydeparture;
            const dutyDeparture = result.rows[0].dutydeparture;
            const dutyTotal = result.rows[0].dutytotal
            reply.setColor(0xff9966)
                .setTitle('Dochádzkový terminál - Odchod')
                .setThumbnail(okImage)
                .addFields(
                    {
                        name: 'Deň a čas príchodu',
                        value: `**${dayArrival}** o **${dutyArrival}**`
                    },
                    {
                        name: 'Deň a čas odchodu',
                        value: `**${dayDeparture}** o **${dutyDeparture}**`
                    },
                    {
                        name: 'Celkový čas',
                        value: `**${dutyTotal}**`
                    }                                
                )
            const chiefReply = new EmbedBuilder({
                color: 0xff9966,
                title: 'Dochádzkový terminál - Odchod',
                description: `Zamestnanec <@${interaction.user.id}>`,
                thumbnail: {url: okImage},
                fields: [
                    {
                        name: 'Deň a čas príchodu',
                        value: `**${dayArrival}** o **${dutyArrival}**`
                    },
                    {
                        name: 'Deň a čas odchodu',
                        value: `**${dayDeparture}** o **${dutyDeparture}**`
                    },
                    {
                        name: 'Celkový čas',
                        value: `**${dutyTotal}**`
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