import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5002;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`VendorPulse API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start VendorPulse server");
    console.error(error.message);
    process.exit(1);
  }
}

startServer();