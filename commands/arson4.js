const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const readDatabase = require('../databaseFunctions/readDatabase');
require('dotenv').config();
const { okImage, warnImage, nokImage } = require('../images/images.js');
const writeDatabase = require('../databaseFunctions/writeDatabase.js');
const sendChannelEmbedMessage = require('../functions/sendChannelEmbedMessage.js');
const { client } = require('../index.js');

module.exports =  {
    data: new SlashCommandBuilder()
    .setName('arson-investigate')
    .setDescription('Zápis vyšetrovania'),
    allowRoles: [ 
        process.env.ARSON_CHIEF,
        process.env.ARSON_DEPUTY,
        process.env.ARSON,
    ], 
    allowChannels: [
        process.env.ACTIVITY_CHANNEL_ID
    ],
     async execute(interaction){
        const userID = interaction.user.id;        
        let query = `INSERT INTO lsfd_activity (id_discord, date_time, activity_type) 
            VALUES ($1, CURRENT_TIMESTAMP, $2) 
            RETURNING 
                to_char(date_time::DATE, 'YYYY-MM-DD') AS activity_date,
                to_char(date_time::TIME, 'HH24:MI:SS') AS activity_time,
                activity_type, 
                (SELECT activity_name 
                FROM lsfd_activity_types 
                WHERE lsfd_activity_types.id = lsfd_activity.activity_type) AS activity_name;`;
        let queryValues = [userID,8];
        let result = await writeDatabase(query, queryValues);
        const reply = new EmbedBuilder()
        if (!result){
            reply.setColor(0xffcc00)
                .setTitle('Zápis aktivity - Chyba')
                .setThumbnail(warnImage)
                .setDescription('Záznam sa nepodarilo zapísať');
            
            return interaction.reply({
                embeds: [reply],
                ephemeral: true             
            });            
        }
        console.log(result.rows[0]);
        var type = result.rows[0].activity_name;
        var date = result.rows[0].activity_date;
        var time = result.rows[0].activity_time;
        
        reply.setColor(0xff9966)
                .setTitle(`Zápis aktivity ${type}`)
                .setThumbnail(okImage)
                .addFields(
                    {
                        name: `Aktivita ${type}, bol úspešne zapísaný`,
                        value: '\u200B'
                    }                       
                )
        
        const chiefReply = new EmbedBuilder({
            color: 0xff9966,
            title: 'Zápis aktivity - Potvrdenie',
            description: `Zamestnanec <@${interaction.user.id}>`,
            thumbnail: {url: okImage},
            fields: [
                {
                    name: `Druh aktivity: ***${type}***`,
                    value: `Dátum a čas zápisu: **${date}** o **${time}**`
                }             
            ]
        });
        sendChannelEmbedMessage(chiefReply,process.env.ATT_CHIEF_CHANNEL_ID, client );                    
        return interaction.reply({
            embeds: [reply],
            ephemeral: true             
        });          
    }, 
};