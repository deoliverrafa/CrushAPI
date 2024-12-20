import Mongoose from "mongoose"
const name = "deoliverrafa"
const password = "deoliverrafa"
const uri = `mongodb+srv://${name}:${password}@crushif.lyr0a8x.mongodb.net/?retryWrites=true&w=majority&appName=CrushIF`;

// Realizando a conexão pro banco
class getConnection {
    async connect () {
        Mongoose.connect(uri);
        const connection = Mongoose.connection        
        connection.once('open', () => console.log('DB funcionando'))
        return connection;
    }

    async close() {
        Mongoose.connection.close();
    }
};

export default getConnection;