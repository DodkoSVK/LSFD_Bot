
module.exports = async (interaction, channels) => {
    try {
        console.log('Checking permissions for channel:', interaction.commandName);
        console.log('Channel IDs to check:', channels);

        const correctChannel = channels.some(channel => channel === interaction.channelId);        
        if(correctChannel)
        {
            console.log(`Príkaz "${interaction.commandName}". možno použiť v kanály. 🟢`);
            return true;
        }            
        else {
            console.log(`Príkaz "${interaction.commandName}". nemožno použiť v kanály. 🔴`);
            return false;   
        } 
            
    } catch (error) {
        console.log(`Nastala chyba pri overovaní povolenia pre príkaz "${interaction.commandName}" v kanály s ID ${interaction.channelID} chybou: ${error}. 🔴`);
        return false;
    }
}