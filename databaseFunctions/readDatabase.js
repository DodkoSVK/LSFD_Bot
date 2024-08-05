const pool = require('./connectDatabase');

module.exports = async(query, params) => {
    try {
        const client = await pool.connect();       
        const result = await client.query(query, params);
        client.release();
        if(client.release && result)
            console.log("Dáta z DB prečítané a client odpojený. 🟢");

        if(result.rows.length > 0)
            return result;
        else
            return null;        
        
    } catch (error) {
        console.error('Error executing query', error);
        throw error;
    } 
};