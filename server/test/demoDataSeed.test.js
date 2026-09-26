import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import bcrypt from "bcryptjs";

import { generateCriteriaSignature } from "../src/domain/criteriaSignature.js";
import {
  calculateOverallScore,
  getPerformanceRating,
  getRiskLevel,
} from "../src/domain/evaluationRules.js";
import User from "../src/models/User.js";
import Evaluation from "../src/models/Evaluation.js";
import Supplier from "../src/models/Supplier.js";
import {
  assertDemoDatabaseName,
  buildDemoEvaluations,
  classifyDemoDataState,
  DEMO_EVALUATIONS,
  DEMO_SUPPLIERS,
  DEMO_USERS,
  DemoDataSeedError,
  getDemoUserCredentials,
  seedDemoData,
} from "../src/services/demoDataService.js";
import { BASELINE_KPIS } from "../src/services/databaseInitializationService.js";

const ADMIN_ID = "507f1f77bcf86cd799439011";

function objectIdFor(sequence) {
  return sequence.toString(16).padStart(24, "0");
}

function countsFor(state) {
  return {
    users: state.users.length,
    suppliers: state.suppliers.length,
    kpis: state.kpis.length,
    evaluations: state.evaluations.length,
  };
}

async function approvedBaseline() {
  const adminPasswordHash = await bcrypt.hash(
    randomBytes(24).toString("hex"),
    4
  );
  const admin = {
    _id: ADMIN_ID,
    name: "Existing Administrator",
    email: "administrator@example.com",
    passwordHash: adminPasswordHash,
    role: "ADMIN",
    status: "ACTIVE",
  };

  return {
    users: [admin],
    suppliers: [],
    kpis: BASELINE_KPIS.map((kpi, index) => ({
      _id: objectIdFor(index + 2),
      ...kpi,
      createdBy: ADMIN_ID,
    })),
    evaluations: [],
  };
}

function credentialEnvironment() {
  return {
    DEMO_MANAGER_PASSWORD: `${randomBytes(16).toString("hex")}Aa9!`,
    DEMO_VIEWER_PASSWORD: `${randomBytes(16).toString("hex")}Bb8!`,
  };
}

class MemoryDemoRepository {
  constructor(state, { failEvaluationCreation = false } = {}) {
    this.state = structuredClone(state);
    this.failEvaluationCreation = failEvaluationCreation;
    this.nextId = 20;
  }

  async withTransaction(operation) {
    const snapshot = structuredClone(this.state);

    try {
      return await operation({
        inspect: async () => ({
          counts: countsFor(this.state),
          users: structuredClone(this.state.users),
          suppliers: structuredClone(this.state.suppliers),
          kpis: structuredClone(this.state.kpis),
          evaluations: structuredClone(this.state.evaluations),
        }),
        createUsers: async (records) => {
          const created = records.map((record) => ({
            _id: objectIdFor(this.nextId++),
            ...structuredClone(record),
          }));
          this.state.users.push(...created);
          return structuredClone(created);
        },
        createSuppliers: async (records) => {
          const created = records.map((record) => ({
            _id: objectIdFor(this.nextId++),
            ...structuredClone(record),
          }));
          this.state.suppliers.push(...created);
          return structuredClone(created);
        },
        createEvaluations: async (records) => {
          if (this.failEvaluationCreation) {
            throw new Error("Simulated evaluation persistence failure");
          }

          const created = records.map((record) => ({
            _id: objectIdFor(this.nextId++),
            ...structuredClone(record),
          }));
          this.state.evaluations.push(...created);
          return structuredClone(created);
        },
      });
    } catch (error) {
      this.state = snapshot;
      throw error;
    }
  }
}

async function seedApprovedBaseline(options = {}) {
  const baseline = await approvedBaseline();
  const repository = new MemoryDemoRepository(baseline, options);
  const environment = credentialEnvironment();
  const credentials = getDemoUserCredentials(environment);
  const result = await seedDemoData({
    repository,
    credentials,
    passwordHasher: (password) => bcrypt.hash(password, 4),
  });

  return { baseline, repository, environment, credentials, result };
}

test("database guard accepts only the exact vendorpulse database name", () => {
  assert.equal(assertDemoDatabaseName("vendorpulse"), "vendorpulse");
  assert.throws(() => assertDemoDatabaseName("test"), DemoDataSeedError);
  assert.throws(
    () => assertDemoDatabaseName("vendorpulse-preview"),
    DemoDataSeedError
  );
  assert.throws(() => assertDemoDatabaseName(""), DemoDataSeedError);
});

test("demo user credentials must come from environment values", () => {
  assert.throws(() => getDemoUserCredentials({}), /DEMO_MANAGER_PASSWORD/);
  assert.throws(
    () =>
      getDemoUserCredentials({
        DEMO_MANAGER_PASSWORD: randomBytes(16).toString("hex"),
      }),
    /DEMO_VIEWER_PASSWORD/
  );

  const credentials = getDemoUserCredentials(credentialEnvironment());
  assert.deepEqual(
    credentials.map(({ name, email, role }) => ({ name, email, role })),
    DEMO_USERS.map(({ name, email, role }) => ({ name, email, role }))
  );
});

test("approved baseline becomes the complete demo dataset and preserves the Admin", async () => {
  const { baseline, repository, credentials, result } =
    await seedApprovedBaseline();

  assert.equal(result.status, "SEEDED");
  assert.deepEqual(result.counts, {
    users: 3,
    suppliers: 5,
    kpis: 3,
    evaluations: 8,
  });
  assert.deepEqual(repository.state.users[0], baseline.users[0]);
  assert.equal(
    classifyDemoDataState({
      ...repository.state,
      counts: countsFor(repository.state),
    }),
    "DEMO_SEEDED"
  );

  const manager = repository.state.users.find(
    (user) => user.role === "PROCUREMENT_MANAGER"
  );
  const viewer = repository.state.users.find((user) => user.role === "VIEWER");

  assert.equal(Boolean(manager), true);
  assert.equal(Boolean(viewer), true);
  assert.equal(
    await bcrypt.compare(
      credentials.find((item) => item.email === manager.email).password,
      manager.passwordHash
    ),
    true
  );
  assert.equal(
    await bcrypt.compare(
      credentials.find((item) => item.email === viewer.email).password,
      viewer.passwordHash
    ),
    true
  );
  assert.equal(Object.hasOwn(new User(manager).toJSON(), "passwordHash"), false);
  assert.equal(Object.hasOwn(new User(viewer).toJSON(), "passwordHash"), false);

  assert.deepEqual(
    repository.state.suppliers.map((supplier) => supplier.supplierName).sort(),
    DEMO_SUPPLIERS.map((supplier) => supplier.supplierName).sort()
  );
  assert.equal(
    repository.state.suppliers.every(
      (supplier) =>
        supplier.status === "ACTIVE" && supplier.createdBy === manager._id
    ),
    true
  );
});

test("all evaluations use trusted KPI snapshots and calculated classifications", async () => {
  const { repository } = await seedApprovedBaseline();
  const criteriaSignature = generateCriteriaSignature(repository.state.kpis);
  const supplierPeriods = new Set();

  for (const evaluation of repository.state.evaluations) {
    const uniqueKey = `${evaluation.supplierId}:${evaluation.year}:Q${evaluation.quarter}`;
    assert.equal(supplierPeriods.has(uniqueKey), false);
    supplierPeriods.add(uniqueKey);

    assert.equal(evaluation.criteriaSignature, criteriaSignature);
    assert.deepEqual(
      evaluation.scores.map(({ kpiNameSnapshot, weightSnapshot }) => ({
        name: kpiNameSnapshot,
        weight: weightSnapshot,
      })),
      BASELINE_KPIS.map(({ name, weight }) => ({ name, weight }))
    );

    const calculatedOverall = calculateOverallScore(evaluation.scores);
    assert.equal(evaluation.overallScore, calculatedOverall);
    assert.equal(
      evaluation.performanceRating,
      getPerformanceRating(calculatedOverall)
    );
    assert.equal(evaluation.riskLevel, getRiskLevel(calculatedOverall));
    assert.equal(evaluation.comments.length > 0, true);
    assert.equal(
      evaluation.scores.every((score) => score.comment.length > 0),
      true
    );
  }

  assert.equal(supplierPeriods.size, 8);
  assert.equal(
    repository.state.evaluations.filter(
      (evaluation) => evaluation.year === 2026 && evaluation.quarter === 3
    ).length,
    5
  );
  assert.equal(
    repository.state.evaluations.filter(
      (evaluation) => evaluation.year === 2026 && evaluation.quarter === 2
    ).length,
    3
  );
});

test("supplier and evaluation records satisfy the current Mongoose schemas", async () => {
  const { repository } = await seedApprovedBaseline();

  for (const supplier of repository.state.suppliers) {
    await new Supplier(supplier).validate();
  }

  for (const evaluation of repository.state.evaluations) {
    await new Evaluation(evaluation).validate();
  }
});

test("Q2 to Q3 history shows improvement, stability and modest decline", async () => {
  const { repository } = await seedApprovedBaseline();
  const supplierNames = new Map(
    repository.state.suppliers.map((supplier) => [
      supplier._id,
      supplier.supplierName,
    ])
  );
  const histories = new Map();

  for (const evaluation of repository.state.evaluations) {
    const name = supplierNames.get(evaluation.supplierId);
    const history = histories.get(name) ?? {};
    history[evaluation.quarter] = evaluation.overallScore;
    histories.set(name, history);
  }

  assert.equal(histories.get("Meridian Components")[3] > histories.get("Meridian Components")[2], true);
  assert.equal(histories.get("Northstar Industrial Supply")[3], histories.get("Northstar Industrial Supply")[2]);
  assert.equal(histories.get("Crestline Technologies")[3] < histories.get("Crestline Technologies")[2], true);
  assert.equal(
    histories.get("Crestline Technologies")[2] -
      histories.get("Crestline Technologies")[3] <=
      0.5,
    true
  );
});

test("rerunning against the exact demo dataset is an idempotent no-op", async () => {
  const { repository, credentials } = await seedApprovedBaseline();
  const firstState = structuredClone(repository.state);
  const result = await seedDemoData({ repository, credentials });

  assert.equal(result.status, "ALREADY_SEEDED");
  assert.deepEqual(repository.state, firstState);
});

test("partial or altered data aborts without changes", async () => {
  const baseline = await approvedBaseline();
  baseline.suppliers.push({
    _id: objectIdFor(90),
    supplierName: "Unapproved Company",
    category: "Services",
    status: "ACTIVE",
    createdBy: ADMIN_ID,
  });
  const repository = new MemoryDemoRepository(baseline);
  const initialState = structuredClone(repository.state);

  await assert.rejects(
    seedDemoData({
      repository,
      credentials: getDemoUserCredentials(credentialEnvironment()),
    }),
    /exact approved baseline or demo dataset/
  );
  assert.deepEqual(repository.state, initialState);

  const invalidKpis = await approvedBaseline();
  invalidKpis.kpis[0].weight = 40;
  const invalidRepository = new MemoryDemoRepository(invalidKpis);

  await assert.rejects(
    seedDemoData({
      repository: invalidRepository,
      credentials: getDemoUserCredentials(credentialEnvironment()),
    }),
    /exact approved baseline or demo dataset/
  );
  assert.deepEqual(invalidRepository.state, invalidKpis);
});

test("transaction rollback prevents a partial demo seed", async () => {
  const baseline = await approvedBaseline();
  const repository = new MemoryDemoRepository(baseline, {
    failEvaluationCreation: true,
  });

  await assert.rejects(
    seedDemoData({
      repository,
      credentials: getDemoUserCredentials(credentialEnvironment()),
      passwordHasher: (password) => bcrypt.hash(password, 4),
    }),
    /Simulated evaluation persistence failure/
  );
  assert.deepEqual(repository.state, baseline);
});

test("visible demo data uses professional names and reserved email domains", () => {
  const prohibited = /\b(Codex|ChatGPT|Test|Dummy|Sample|QA|Automation|Temp|Supplier \d+|User \d+|F[1-8])\b/i;
  const visibleText = JSON.stringify({
    users: DEMO_USERS,
    suppliers: DEMO_SUPPLIERS,
    evaluations: DEMO_EVALUATIONS,
  });

  assert.equal(prohibited.test(visibleText), false);
  assert.equal(
    [...DEMO_USERS, ...DEMO_SUPPLIERS].every(
      (record) => !record.email || record.email.endsWith("@example.com")
    ),
    true
  );
});

test("seed implementation contains no destructive database operation or credential logging", async () => {
  const sources = await Promise.all([
    readFile(new URL("../src/services/demoDataService.js", import.meta.url), "utf8"),
    readFile(new URL("../src/scripts/seedDemoData.js", import.meta.url), "utf8"),
  ]);
  const source = sources.join("\n");

  assert.doesNotMatch(source, /dropDatabase\s*\(/);
  assert.doesNotMatch(source, /deleteMany\s*\(\s*\{\s*\}\s*\)/);
  assert.doesNotMatch(source, /collection\.drop\s*\(/);
  assert.doesNotMatch(
    source,
    /console\.(?:log|error)\s*\([^)]*(?:password|passwordHash)/i
  );
});

test("the proposed evaluation definitions build the expected matrix", async () => {
  const baseline = await approvedBaseline();
  const suppliers = DEMO_SUPPLIERS.map((supplier, index) => ({
    _id: objectIdFor(index + 40),
    ...supplier,
  }));
  const evaluations = buildDemoEvaluations({
    kpis: baseline.kpis,
    suppliers,
    evaluatorId: objectIdFor(70),
  });

  assert.deepEqual(
    evaluations.map(
      ({ year, quarter, overallScore, performanceRating, riskLevel }) => ({
        year,
        quarter,
        overallScore,
        performanceRating,
        riskLevel,
      })
    ),
    [
      { year: 2026, quarter: 2, overallScore: 4, performanceRating: "EXCELLENT", riskLevel: "LOW" },
      { year: 2026, quarter: 2, overallScore: 3.45, performanceRating: "GOOD", riskLevel: "MODERATE" },
      { year: 2026, quarter: 2, overallScore: 3.55, performanceRating: "GOOD", riskLevel: "MODERATE" },
      { year: 2026, quarter: 3, overallScore: 4.45, performanceRating: "EXCELLENT", riskLevel: "LOW" },
      { year: 2026, quarter: 3, overallScore: 4, performanceRating: "EXCELLENT", riskLevel: "LOW" },
      { year: 2026, quarter: 3, overallScore: 3.45, performanceRating: "GOOD", riskLevel: "MODERATE" },
      { year: 2026, quarter: 3, overallScore: 3.3, performanceRating: "GOOD", riskLevel: "MODERATE" },
      { year: 2026, quarter: 3, overallScore: 2.45, performanceRating: "NEEDS_IMPROVEMENT", riskLevel: "HIGH" },
    ]
  );
});
