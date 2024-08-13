const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { okImage, warnImage, nokImage } = require('../images/images.js');
const writeDatabase = require('../databaseFunctions/writeDatabase.js');
const sendChannelEmbedMessage = require('../functions/sendChannelEmbedMessage.js');
const { client } = require('../index.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('zmluva')
        .setDescription('vygenerovanie pracovnej zmluvy')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Meno zamestnanca')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('surname')
                .setDescription('Priezvisko zamestnanca')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('mail')
                .setDescription('Email zamestnanca')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('startdate')
                .setDescription('Datum zaciatku')
                .setRequired(true)
        ),    
    allowRoles: [ 
        process.env.ARSON_CHIEF,
        process.env.ARSON_DEPUTY,
        process.env.ARSON,
    ], 
    allowChannels: [
        process.env.ACTIVITY_CHANNEL_ID
    ],
    async execute(interaction){
        // Získanie hodnôt zo slash commandu
        const name = interaction.options.getString('name');
        const surname = interaction.options.getString('surname');

        // Cesta k PDF súboru
        const pdfPath = path.join(__dirname, '..','pdfs', 'LSFD-Zmluva.pdf');
        
        // Načítanie PDF
        const existingPdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Pridať font do dokumentu
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Práca s prvou stranou
        const firstPage = pdfDoc.getPage(0);
        firstPage.drawText(`${name} ${surname}`, {
            x: 183,
            y: 537,
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0)
        });

        // Práca s druhou stranou
        const secondPage = pdfDoc.getPage(1);
        secondPage.drawText(`${name} ${surname}`, {
            x: 503,
            y: 798,
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0)
        });

        // Uloženie zmeneného PDF
        const pdfBytes = await pdfDoc.save();
        const outputPdfPath = path.join(__dirname, '..', `zmluva_${name}_${surname}.pdf`);
        fs.writeFileSync(outputPdfPath, pdfBytes);

        // Odošle PDF ako súborový priložený súbor
        await interaction.reply({
            ephemeral: true,
            content: `Pracovná zmluva pre ${name} ${surname} bola vygenerovaná.`,
            files: [{
                attachment: outputPdfPath,
                name: `zmluva_${name}_${surname}.pdf`
            }],
            
        });
    }, 
};
