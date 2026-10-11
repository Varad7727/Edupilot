// start server
require('dotenv').config();
const app = require("../backend/app.js");
const connectDB = require("../backend/db/db.js");

connectDB();

app.listen(3000, () => {
    console.log("Server is running on port 3000");
})