const dotenv = require("dotenv");
dotenv.config();

const app = require("./src");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

