require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to Database
console.log('MONGO_URL:', process.env.MONGO_URL); // Debugging
connectDB();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Server ready

// Server ready

// Server ready
