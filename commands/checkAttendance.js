const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const readDatabase = require('../databaseFunctions/readDatabase');
const writeDatabase = require('../databaseFunctions/writeDatabase.js');
const { okImage, warnImage, nokImage } = require('../images/images.js');
const sendChannelEmbedMessage = require('../functions/sendChannelEmbedMessage.js');
const { client } = require('../index.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kontrola')
        .setDescription('Kontrola dochádzky zamestnanca')
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Počet dní od dnešného dňa')
                .setRequired(true)
        ),
    allowRoles: [
        process.env.FD_MANAGEMENT
    ],
    allowChannels: [
        process.env.ATT_CHECK_CHANNEL_ID
    ],
    async execute(interaction) {
        // Načítaj všetkých členov servera
        const members = await interaction.guild.members.fetch();

        // ID rolí, ktoré chceme filtrovať
        const candidateRoleId = process.env.CANDIDATE_ROLE;
        const fdRoleId = process.env.FD_ROLE;

        // Filtruj členov na základe toho, či majú aspoň jednu z požadovaných rolí
        const filteredMembers = members.filter(member => 
            member.roles.cache.has(candidateRoleId) || member.roles.cache.has(fdRoleId)
        );

        // Vytvor pole možností pre výberové menu
        const options = filteredMembers.map(member => ({
            label: member.nickname || member.user.username, // Použi prezývku, ak existuje, inak používateľské meno
            description: member.user.tag,
            value: member.user.id
        }));

        // Funkcia na rozdelenie možností do menších polí s maximálne 25 položkami
        function chunkArray(array, chunkSize) {
            const chunks = [];
            for (let i = 0; i < array.length; i += chunkSize) {
                chunks.push(array.slice(i, i + chunkSize));
            }
            return chunks;
        }

        // Rozdeľ možnosti do kusov
        const chunks = chunkArray(options, 25);

        // Vytvor viacero výberových menu
        const rows = chunks.map((chunk, index) => {
            const userSelect = new StringSelectMenuBuilder()
                .setCustomId(`users_${index}`)
                .setPlaceholder('Vyber si zamestnanca')
                .addOptions(chunk)
                .setMinValues(1)
                .setMaxValues(1);

            return new ActionRowBuilder().addComponents(userSelect);
        });

        const response = await interaction.reply({
            content: 'Vyber si zamestnanca',
            components: rows,
		ephemeral: true 
        });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3_600_000 });
        collector.on('collect', async i => {
            const selection = i.values[0];
            const days = interaction.options.getInteger('days');
let query = `SELECT 
                to_char(arrival::DATE, 'YYYY-MM-DD') AS DayArrival,
                to_char(arrival::TIME, 'HH24:MI:SS') AS DutyArrival,
                to_char(departure::DATE, 'YYYY-MM-DD') AS DayDeparture,
                to_char(departure::TIME, 'HH24:MI:SS') AS DutyDeparture,
                to_char(total::TIME, 'HH24:MI:SS') AS DutyTotal 
                FROM 
                lsfd_attendance
                WHERE emp = $1 and arrival >= now()::date - interval '${days} days'`;
let queryValues = [selection];

const result = await readDatabase(query, queryValues);

            const replyMessage = new EmbedBuilder()
                .setColor(0xffcc00)
                .setTitle(`Výpis z dochádzky zamestnanca`)
                .setDescription(`<@${selection}>`);
            if (result) {
                result.rows.forEach(row => {
                    replyMessage.addFields([
                        {
                            name: `Dňa ${row.dayarrival}`,
                            value: `Príchod: *${row.dutyarrival}*`,
                            inline: true
                        },
                        {
                            name: '\u200B', // Non-breaking space to create a new line
                            value: `Odchod: *${row.dutydeparture}*`,
                            inline: true
                        },
                        {
                            name: '\u200B', // Non-breaking space to create a new line
                            value: `Celkom: *${row.dutytotal}*`,
                            inline: true
                        }
                    ]);
                    console.log(`Prichod: ${row.dayarrival} o ${row.dutyarrival}. Odchod: ${row.daydeparture} o ${row.dutydeparture}. Celkom ${row.dutytotal}.`);
                });
            }

            // Deaktivuj výberové menu
            const disabledRows = rows.map(row => {
                row.components[0].setDisabled(true);
                return row;
            });

            // Upravi odpoveď, aby sa deaktivovali komponenty
            await interaction.editReply({
                components: disabledRows
            });

            await i.reply({
                embeds: [replyMessage],
		ephemeral: true 
            });
        });
    },
};
