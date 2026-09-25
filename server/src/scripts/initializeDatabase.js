import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import Evaluation from "../models/Evaluation.js";
import KPI from "../models/KPI.js";
import Supplier from "../models/Supplier.js";
import User from "../models/User.js";
import {
  DatabaseInitializationError,
  getExplicitDatabaseName,
  getInitialAdminCredentials,
  initializeDatabase,
} from "../services/databaseInitializationService.js";

async function inspectApplicationData(session) {
  const users = await User.countDocuments({}).session(session);
  const suppliers = await Supplier.countDocuments({}).session(session);
  const kpis = await KPI.countDocuments({}).session(session);
  const evaluations = await Evaluation.countDocuments({}).session(session);

  const counts = { users, suppliers, kpis, evaluations };

  if (users !== 1 || suppliers !== 0 || kpis !== 3 || evaluations !== 0) {
    return { counts, users: [], kpis: [] };
  }

  const userRecords = await User.find({})
    .select("+passwordHash")
    .session(session)
    .lean();
  const kpiRecords = await KPI.find({})
    .session(session)
    .lean();

  return {
    counts,
    users: userRecords,
    kpis: kpiRecords,
  };
}

function createMongooseRepository() {
  return {
    async withTransaction(operation) {
      const session = await mongoose.startSession();
      let result;

      try {
        await session.withTransaction(async () => {
          result = await operation({
            inspect: () => inspectApplicationData(session),
            async createAdmin(data) {
              const [admin] = await User.create([data], { session });
              return admin;
            },
            createKpis(data) {
              return KPI.create(data, {
                session,
                ordered: true,
              });
            },
          });
        });

        return result;
      } finally {
        await session.endSession();
      }
    },
  };
}

async function main() {
  const credentials = getInitialAdminCredentials(process.env);
  const expectedDatabaseName = getExplicitDatabaseName(
    process.env.MONGODB_URI
  );

  try {
    await connectDB({
      autoCreate: false,
      autoIndex: false,
    });

    if (mongoose.connection.name !== expectedDatabaseName) {
      throw new DatabaseInitializationError(
        "Connected database does not match the explicit MONGODB_URI database name"
      );
    }

    const result = await initializeDatabase({
      repository: createMongooseRepository(),
      credentials,
    });

    console.log(
      result.status === "INITIALIZED"
        ? "VendorPulse database initialized successfully"
        : "VendorPulse database already contains the approved baseline"
    );
    console.log(`Database: ${expectedDatabaseName}`);
    console.log(
      `Records: ${result.counts.users} user, ${result.counts.kpis} KPIs, ${result.counts.suppliers} suppliers, ${result.counts.evaluations} evaluations`
    );
    console.log(
      `Active KPI weight total: ${result.totalActiveKpiWeight}%`
    );
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

main().catch((error) => {
  console.error("VendorPulse database initialization failed");

  if (error instanceof DatabaseInitializationError) {
    console.error(error.message);
  } else {
    console.error(
      "An unexpected error occurred; no credential or connection details were logged"
    );
  }

  process.exitCode = 1;
});
