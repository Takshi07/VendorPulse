import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import Evaluation from "../models/Evaluation.js";
import KPI from "../models/KPI.js";
import Supplier from "../models/Supplier.js";
import User from "../models/User.js";
import {
  assertDemoDatabaseName,
  DemoDataSeedError,
  getDemoUserCredentials,
  seedDemoData,
} from "../services/demoDataService.js";
import { getExplicitDatabaseName } from "../services/databaseInitializationService.js";

async function inspectApplicationData(session) {
  const users = await User.countDocuments({}).session(session);
  const suppliers = await Supplier.countDocuments({}).session(session);
  const kpis = await KPI.countDocuments({}).session(session);
  const evaluations = await Evaluation.countDocuments({}).session(session);
  const counts = { users, suppliers, kpis, evaluations };
  const expectedRecordCount =
    (users === 1 && suppliers === 0 && kpis === 3 && evaluations === 0) ||
    (users === 3 && suppliers === 5 && kpis === 3 && evaluations === 8);

  if (!expectedRecordCount) {
    return {
      counts,
      users: [],
      suppliers: [],
      kpis: [],
      evaluations: [],
    };
  }

  const userRecords = await User.find({})
    .select("+passwordHash")
    .session(session)
    .lean();
  const supplierRecords = await Supplier.find({}).session(session).lean();
  const kpiRecords = await KPI.find({}).session(session).lean();
  const evaluationRecords = await Evaluation.find({}).session(session).lean();

  return {
    counts,
    users: userRecords,
    suppliers: supplierRecords,
    kpis: kpiRecords,
    evaluations: evaluationRecords,
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
            createUsers: (data) =>
              User.create(data, { session, ordered: true }),
            createSuppliers: (data) =>
              Supplier.create(data, { session, ordered: true }),
            createEvaluations: (data) =>
              Evaluation.create(data, { session, ordered: true }),
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
  const explicitDatabaseName = getExplicitDatabaseName(process.env.MONGODB_URI);
  assertDemoDatabaseName(explicitDatabaseName);
  const credentials = getDemoUserCredentials(process.env);

  try {
    await connectDB({ autoCreate: false, autoIndex: false });

    assertDemoDatabaseName(mongoose.connection.name);

    if (mongoose.connection.name !== explicitDatabaseName) {
      throw new DemoDataSeedError(
        "Connected database does not match the explicit MONGODB_URI database name"
      );
    }

    const result = await seedDemoData({
      repository: createMongooseRepository(),
      credentials,
    });

    console.log(
      result.status === "SEEDED"
        ? "VendorPulse demo data seeded successfully"
        : "VendorPulse database already contains the approved demo dataset"
    );
    console.log(`Database: ${explicitDatabaseName}`);
    console.log(
      `Records: ${result.counts.users} users, ${result.counts.kpis} KPIs, ${result.counts.suppliers} suppliers, ${result.counts.evaluations} evaluations`
    );
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

main().catch((error) => {
  console.error("VendorPulse demo data seeding failed");

  if (error instanceof DemoDataSeedError) {
    console.error(error.message);
  } else {
    console.error(
      "An unexpected error occurred; no credential or connection details were logged"
    );
  }

  process.exitCode = 1;
});
