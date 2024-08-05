module.exports = async(embedMessage, channelId, client) => {
    const channel = client.channels.cache.get(channelId);
    if(channel)
        await channel.send({ embeds : [embedMessage]});
    else
        console.log(`Problém so získaním kanála s ID: "${channelId}". 🔴`);
}