const express = require('express');
const cors = require('cors');
require('dotenv').config();
import { MongoClient } from 'mongodb';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic API Route
app.get('/', (req, res) => {
    res.send('Server is running smoothly kabya-ai');
});

async function runGetStarted() {
    // Replace the uri string with your connection string
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri);
    try {
        const database = client.db('Kabya-AI');
        // Queries for a movie that has a title value of 'Back to the Future'
        const query = { title: 'Back to the Future' };
        const movie = await movies.findOne(query);
        console.log(movie);
    } finally {
        await client.close();
    }
}
runGetStarted().catch(console.dir);

// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});