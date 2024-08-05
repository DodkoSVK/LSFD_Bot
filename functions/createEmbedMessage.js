const {EmbedBuilder} = require('discord.js');
module.exports = async (
    color = null,
    title = null,
    url = null,
    author = null,
    description = null,
    thumbnail = null,
    fields = [],
    image = null,
    timestamp = false,
    footer = null
    ) => {
        console.log(`-*-*-*-*-*-*-*-*-*-\n
    Function createEmbedMessage. Attributes:
    \n> Color: ${color},\n> Title: ${title},\n> Url: ${url},\n> Author: ${author},\n> Desc: ${description},\n> Thumbnail URL: ${thumbnail}
    \n> Fields: ${JSON.stringify(fields)},\n> Image URL: ${image},\n> Timestamp: ${timestamp},\n> Footer: ${footer}`);

    const embedMessage = new EmbedBuilder();

    if (color)
        embedMessage.setColor(color); 
    if (title)
        embedMessage.setTitle(title);
    if (url)
        embedMessage.setURL(url);
    if (author) {
        embedMessage.setAuthor({
            name: author.name || undefined,
            iconURL: author.iconUrl || undefined,
            url: author.url || undefined
        });
    }
    if (description)
        embedMessage.setDescription(description);
    if (thumbnail)
        embedMessage.setThumbnail(thumbnail);
    if (fields.length > 0)
        fields.forEach(field => {
            embedMessage.addFields({
                name: field.name,
                value: field.value,
                inline: field.inline || false
            });
        });
    if (image)
        embedMessage.setImage(image);
    if (timestamp === true)
        embedMessage.setTimestamp();
    if (footer) {
        embedMessage.setFooter({
            text: footer.text || undefined,
            iconURL: footer.iconURL || undefined
        });
    }
    console.log(`\nFunction made all the code.\n-*-*-*-*-*-*-*-*-*-\n`);
    return embedMessage;
}
