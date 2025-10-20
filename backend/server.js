//server.js
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/connectDB.js";

const dotenvResult = dotenv.config(); // By default, it looks for .env in the current directory

if (dotenvResult.error) {
  console.error('!!! ERROR loading .env file !!!', dotenvResult.error);
  // If there's an error loading the .env file, it's possible that critical configurations are missing.
  // process.exit(1); // Uncomment if you want to stop the app in this case
} else {
  console.log('>>> .env file successfully loaded.');
  // Uncomment the line below to view the loaded environment variables (FOR DEBUGGING ONLY, NOT FOR PRODUCTION!)
  // console.log('>>> Loaded variables from .env:', dotenvResult.parsed);
}

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
