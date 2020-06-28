const mongoose = require('mongoose');
const Games = require('./routes/games/models/Games');
const GameSeed = require('./seedDataGames.json');
require('dotenv').config();

const seedFunc = async () => {
    try {
        const data = await Games.create(GameSeed);
        console.log(`${data.length} records created`);
        await mongoose.disconnect();
        console.log('MongoDB Disconnected');
        process.exit(0);

    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
    },() => {
    mongoose.connection.db.dropDatabase()
    })
    .then(() => {
        console.log('MongoDB Connection');
        seedFunc();
    })
    .catch((err) => console.log(`MongoDB Connected error: ${err}`));