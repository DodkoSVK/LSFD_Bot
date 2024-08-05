
module.exports = async(interaction, roles) => {
    try {
        console.log('Checking permissions for interaction:', interaction.commandName);
        console.log('Role IDs to check:', roles);
        const hasRole = roles.some(role => interaction.member.roles.cache.has(role));
        if(hasRole)
        {
            console.log(`Užívateľ ${interaction.user.username} má povolenie použiť príkaz "${interaction.commandName}". 🟢`);
            return true;
        }            
        else {
            console.log(`Užívateľ ${interaction.user.username} nemá povolenie použiť príkaz "${interaction.commandName}". 🔴`);
            return false;   
        } 
            
    } catch (error) {
        console.log(`Nastala chyba pri overovaní povolenia pre príkaz "${interaction.commandName}" s chybou: ${error}. 🔴`);
        return false;
    }
}