import {
  KPI_STATUS,
  SUPPLIER_STATUS,
  USER_ROLES,
  USER_STATUS,
} from "../domain/constants.js";
import { generateCriteriaSignature } from "../domain/criteriaSignature.js";
import {
  calculateOverallScore,
  getPerformanceRating,
  getRiskLevel,
} from "../domain/evaluationRules.js";
import { isPasswordHash, hashPassword } from "../domain/passwords.js";
import { BASELINE_KPIS } from "./databaseInitializationService.js";

const APPROVED_DATABASE_NAME = "vendorpulse";

export const DEMO_USERS = Object.freeze([
  Object.freeze({
    name: "Kavya Iyer",
    email: "kavya.iyer@example.com",
    role: USER_ROLES.PROCUREMENT_MANAGER,
    status: USER_STATUS.ACTIVE,
    passwordEnvironmentKey: "DEMO_MANAGER_PASSWORD",
  }),
  Object.freeze({
    name: "Rohan Malhotra",
    email: "rohan.malhotra@example.com",
    role: USER_ROLES.VIEWER,
    status: USER_STATUS.ACTIVE,
    passwordEnvironmentKey: "DEMO_VIEWER_PASSWORD",
  }),
]);

export const DEMO_SUPPLIERS = Object.freeze([
  Object.freeze({
    supplierName: "Meridian Components",
    contactPerson: "Anika Desai",
    email: "anika.desai@example.com",
    phone: "+1 202-555-0101",
    category: "Electronic Components",
    address: "1840 Alder Avenue, Portland, OR",
    taxId: "00-0000101",
    contractStart: "2026-01-01",
    contractEnd: "2027-12-31",
    status: SUPPLIER_STATUS.ACTIVE,
  }),
  Object.freeze({
    supplierName: "BluePeak Industries",
    contactPerson: "Vikram Sethi",
    email: "vikram.sethi@example.com",
    phone: "+1 202-555-0102",
    category: "Precision Manufacturing",
    address: "725 Foundry Lane, Columbus, OH",
    taxId: "00-0000102",
    contractStart: "2026-02-01",
    contractEnd: "2028-01-31",
    status: SUPPLIER_STATUS.ACTIVE,
  }),
  Object.freeze({
    supplierName: "Northstar Industrial Supply",
    contactPerson: "Meera Joshi",
    email: "meera.joshi@example.com",
    phone: "+1 202-555-0103",
    category: "Industrial Supplies",
    address: "460 Harbor Street, Milwaukee, WI",
    taxId: "00-0000103",
    contractStart: "2025-10-01",
    contractEnd: "2027-09-30",
    status: SUPPLIER_STATUS.ACTIVE,
  }),
  Object.freeze({
    supplierName: "Crestline Technologies",
    contactPerson: "Aditya Rao",
    email: "aditya.rao@example.com",
    phone: "+1 202-555-0104",
    category: "Enterprise Technology",
    address: "912 Summit Road, Denver, CO",
    taxId: "00-0000104",
    contractStart: "2026-03-15",
    contractEnd: "2027-03-14",
    status: SUPPLIER_STATUS.ACTIVE,
  }),
  Object.freeze({
    supplierName: "Horizon Materials",
    contactPerson: "Nisha Menon",
    email: "nisha.menon@example.com",
    phone: "+1 202-555-0105",
    category: "Raw Materials",
    address: "338 Prairie Way, Tulsa, OK",
    taxId: "00-0000105",
    contractStart: "2026-01-15",
    contractEnd: "2027-01-14",
    status: SUPPLIER_STATUS.ACTIVE,
  }),
]);

export const DEMO_EVALUATIONS = Object.freeze([
  Object.freeze({
    supplierName: "Meridian Components",
    year: 2026,
    quarter: 2,
    scores: Object.freeze({ Quality: 4, Delivery: 4, Cost: 4 }),
    scoreComments: Object.freeze({
      Quality: "Component quality remained consistent across inspected lots.",
      Delivery: "Shipments arrived within the agreed delivery windows.",
      Cost: "Pricing remained aligned with contracted market rates.",
    }),
    comments: "A reliable quarter with balanced performance across all criteria.",
  }),
  Object.freeze({
    supplierName: "Northstar Industrial Supply",
    year: 2026,
    quarter: 2,
    scores: Object.freeze({ Quality: 4, Delivery: 3, Cost: 3 }),
    scoreComments: Object.freeze({
      Quality: "Materials consistently met the required specifications.",
      Delivery: "Most orders arrived on time, with one minor delay.",
      Cost: "Pricing was reasonable with limited variance from plan.",
    }),
    comments: "Dependable quality supported steady overall performance.",
  }),
  Object.freeze({
    supplierName: "Crestline Technologies",
    year: 2026,
    quarter: 2,
    scores: Object.freeze({ Quality: 3, Delivery: 4, Cost: 4 }),
    scoreComments: Object.freeze({
      Quality: "Solutions met requirements with minor configuration follow-up.",
      Delivery: "Implementation milestones were completed on schedule.",
      Cost: "Commercial terms provided good value for the delivered scope.",
    }),
    comments: "Timely delivery and favorable pricing supported a strong quarter.",
  }),
  Object.freeze({
    supplierName: "Meridian Components",
    year: 2026,
    quarter: 3,
    scores: Object.freeze({ Quality: 5, Delivery: 4, Cost: 4 }),
    scoreComments: Object.freeze({
      Quality: "Consistent component quality with minimal rejection issues.",
      Delivery: "All priority shipments met the agreed delivery window.",
      Cost: "Pricing remained competitive against comparable suppliers.",
    }),
    comments: "Quality improved while delivery and commercial performance remained dependable.",
  }),
  Object.freeze({
    supplierName: "BluePeak Industries",
    year: 2026,
    quarter: 3,
    scores: Object.freeze({ Quality: 4, Delivery: 4, Cost: 4 }),
    scoreComments: Object.freeze({
      Quality: "Manufactured parts consistently met dimensional requirements.",
      Delivery: "Production orders were completed within committed lead times.",
      Cost: "Quoted rates remained stable throughout the quarter.",
    }),
    comments: "Consistent execution across quality, delivery, and cost commitments.",
  }),
  Object.freeze({
    supplierName: "Northstar Industrial Supply",
    year: 2026,
    quarter: 3,
    scores: Object.freeze({ Quality: 4, Delivery: 3, Cost: 3 }),
    scoreComments: Object.freeze({
      Quality: "Supplied materials continued to meet specification consistently.",
      Delivery: "Routine orders were reliable, though expedited requests varied.",
      Cost: "Pricing stayed broadly in line with the contracted schedule.",
    }),
    comments: "Performance remained stable with dependable product quality.",
  }),
  Object.freeze({
    supplierName: "Crestline Technologies",
    year: 2026,
    quarter: 3,
    scores: Object.freeze({ Quality: 3, Delivery: 4, Cost: 3 }),
    scoreComments: Object.freeze({
      Quality: "Deliverables met requirements after limited revision cycles.",
      Delivery: "Planned releases were completed within the agreed schedule.",
      Cost: "Additional service requests reduced the quarter's cost efficiency.",
    }),
    comments: "Delivery remained strong, while service costs softened overall performance.",
  }),
  Object.freeze({
    supplierName: "Horizon Materials",
    year: 2026,
    quarter: 3,
    scores: Object.freeze({ Quality: 3, Delivery: 2, Cost: 2 }),
    scoreComments: Object.freeze({
      Quality: "Material quality was acceptable but showed batch variation.",
      Delivery: "Delivery delays affected two scheduled procurement cycles.",
      Cost: "Expedited freight charges placed pressure on total purchase cost.",
    }),
    comments: "Corrective action is needed on delivery reliability and landed cost control.",
  }),
]);

export class DemoDataSeedError extends Error {
  constructor(message) {
    super(message);
    this.name = "DemoDataSeedError";
  }
}

export function assertDemoDatabaseName(databaseName) {
  if (databaseName !== APPROVED_DATABASE_NAME) {
    throw new DemoDataSeedError(
      `Demo data may only be seeded into the ${APPROVED_DATABASE_NAME} database`
    );
  }

  return databaseName;
}

export function getDemoUserCredentials(environment) {
  return DEMO_USERS.map((user) => {
    const password = environment[user.passwordEnvironmentKey];

    if (!password || password.length < 8) {
      throw new DemoDataSeedError(
        `${user.passwordEnvironmentKey} is required and must be at least 8 characters`
      );
    }

    return { ...user, password };
  });
}

function expectedCounts(state, expected) {
  return Object.entries(expected).every(
    ([key, value]) => state.counts[key] === value
  );
}

function sameId(left, right) {
  return String(left) === String(right);
}

function exactBaselineKpis(kpis, adminId) {
  if (kpis.length !== BASELINE_KPIS.length) return false;

  const storedByName = new Map(kpis.map((kpi) => [kpi.name, kpi]));

  if (storedByName.size !== BASELINE_KPIS.length) return false;

  return BASELINE_KPIS.every((expected) => {
    const stored = storedByName.get(expected.name);

    return Boolean(
      stored &&
        Number(stored.weight) === expected.weight &&
        stored.status === KPI_STATUS.ACTIVE &&
        sameId(stored.createdBy, adminId)
    );
  });
}

function baselineAdmin(state) {
  const admins = state.users.filter(
    (user) =>
      user.role === USER_ROLES.ADMIN &&
      user.status === USER_STATUS.ACTIVE &&
      isPasswordHash(user.passwordHash)
  );

  return admins.length === 1 ? admins[0] : null;
}

function isApprovedBaseline(state) {
  if (
    !expectedCounts(state, {
      users: 1,
      suppliers: 0,
      kpis: 3,
      evaluations: 0,
    }) ||
    state.users.length !== 1
  ) {
    return false;
  }

  const admin = baselineAdmin(state);
  return Boolean(admin && exactBaselineKpis(state.kpis, admin._id));
}

function normalizedDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function sameSupplier(stored, expected, managerId) {
  return (
    stored.supplierName === expected.supplierName &&
    stored.contactPerson === expected.contactPerson &&
    stored.email === expected.email &&
    stored.phone === expected.phone &&
    stored.category === expected.category &&
    stored.address === expected.address &&
    stored.taxId === expected.taxId &&
    normalizedDate(stored.contractStart) === expected.contractStart &&
    normalizedDate(stored.contractEnd) === expected.contractEnd &&
    stored.status === SUPPLIER_STATUS.ACTIVE &&
    sameId(stored.createdBy, managerId)
  );
}

export function buildDemoEvaluations({ kpis, suppliers, evaluatorId }) {
  const criteriaSignature = generateCriteriaSignature(kpis);
  const kpisByName = new Map(kpis.map((kpi) => [kpi.name, kpi]));
  const suppliersByName = new Map(
    suppliers.map((supplier) => [supplier.supplierName, supplier])
  );

  return DEMO_EVALUATIONS.map((definition) => {
    const supplier = suppliersByName.get(definition.supplierName);

    if (!supplier) {
      throw new DemoDataSeedError(
        `Demo supplier is unavailable: ${definition.supplierName}`
      );
    }

    const scores = BASELINE_KPIS.map(({ name }) => {
      const kpi = kpisByName.get(name);

      if (!kpi) {
        throw new DemoDataSeedError(`Baseline KPI is unavailable: ${name}`);
      }

      return {
        kpiId: kpi._id,
        kpiNameSnapshot: kpi.name,
        weightSnapshot: kpi.weight,
        score: definition.scores[name],
        comment: definition.scoreComments[name],
      };
    });

    const overallScore = calculateOverallScore(scores);

    return {
      supplierId: supplier._id,
      evaluatorId,
      year: definition.year,
      quarter: definition.quarter,
      criteriaSignature,
      scores,
      overallScore,
      performanceRating: getPerformanceRating(overallScore),
      riskLevel: getRiskLevel(overallScore),
      comments: definition.comments,
    };
  });
}

function sameEvaluation(stored, expected) {
  if (
    !sameId(stored.supplierId, expected.supplierId) ||
    !sameId(stored.evaluatorId, expected.evaluatorId) ||
    stored.year !== expected.year ||
    stored.quarter !== expected.quarter ||
    stored.criteriaSignature !== expected.criteriaSignature ||
    Number(stored.overallScore) !== expected.overallScore ||
    stored.performanceRating !== expected.performanceRating ||
    stored.riskLevel !== expected.riskLevel ||
    stored.comments !== expected.comments ||
    stored.scores.length !== expected.scores.length
  ) {
    return false;
  }

  const storedScores = new Map(
    stored.scores.map((score) => [String(score.kpiId), score])
  );

  return expected.scores.every((score) => {
    const storedScore = storedScores.get(String(score.kpiId));

    return Boolean(
      storedScore &&
        storedScore.kpiNameSnapshot === score.kpiNameSnapshot &&
        Number(storedScore.weightSnapshot) === Number(score.weightSnapshot) &&
        storedScore.score === score.score &&
        storedScore.comment === score.comment
    );
  });
}

function isIntendedDemoState(state) {
  if (
    !expectedCounts(state, {
      users: 3,
      suppliers: 5,
      kpis: 3,
      evaluations: 8,
    })
  ) {
    return false;
  }

  const admin = baselineAdmin(state);
  if (!admin || !exactBaselineKpis(state.kpis, admin._id)) return false;

  const usersByEmail = new Map(state.users.map((user) => [user.email, user]));
  const demoUsersMatch = DEMO_USERS.every((expected) => {
    const stored = usersByEmail.get(expected.email);
    return Boolean(
      stored &&
        stored.name === expected.name &&
        stored.role === expected.role &&
        stored.status === expected.status &&
        isPasswordHash(stored.passwordHash)
    );
  });

  if (!demoUsersMatch || usersByEmail.size !== 3) return false;

  const manager = usersByEmail.get("kavya.iyer@example.com");
  const suppliersByName = new Map(
    state.suppliers.map((supplier) => [supplier.supplierName, supplier])
  );

  if (
    suppliersByName.size !== DEMO_SUPPLIERS.length ||
    !DEMO_SUPPLIERS.every((expected) => {
      const stored = suppliersByName.get(expected.supplierName);
      return stored && sameSupplier(stored, expected, manager._id);
    })
  ) {
    return false;
  }

  const expectedEvaluations = buildDemoEvaluations({
    kpis: state.kpis,
    suppliers: state.suppliers,
    evaluatorId: manager._id,
  });
  const storedByPeriod = new Map(
    state.evaluations.map((evaluation) => [
      `${evaluation.supplierId}:${evaluation.year}:Q${evaluation.quarter}`,
      evaluation,
    ])
  );

  return (
    storedByPeriod.size === expectedEvaluations.length &&
    expectedEvaluations.every((expected) => {
      const key = `${expected.supplierId}:${expected.year}:Q${expected.quarter}`;
      const stored = storedByPeriod.get(key);
      return stored && sameEvaluation(stored, expected);
    })
  );
}

export function classifyDemoDataState(state) {
  if (isApprovedBaseline(state)) return "BASELINE";
  if (isIntendedDemoState(state)) return "DEMO_SEEDED";
  return "UNEXPECTED";
}

export async function seedDemoData({
  repository,
  credentials,
  passwordHasher = hashPassword,
}) {
  if (!Array.isArray(credentials) || credentials.length !== DEMO_USERS.length) {
    throw new DemoDataSeedError("Both demo user credentials are required");
  }

  return repository.withTransaction(async (transaction) => {
    const initialState = await transaction.inspect();
    const classification = classifyDemoDataState(initialState);

    if (classification === "DEMO_SEEDED") {
      return { status: "ALREADY_SEEDED", counts: initialState.counts };
    }

    if (classification === "UNEXPECTED") {
      throw new DemoDataSeedError(
        "Database does not contain the exact approved baseline or demo dataset; demo seeding was aborted without changes"
      );
    }

    const userRecords = [];

    for (const expected of DEMO_USERS) {
      const supplied = credentials.find(
        (credential) => credential.email === expected.email
      );

      if (!supplied?.password || supplied.password.length < 8) {
        throw new DemoDataSeedError(
          `A valid password is required for ${expected.email}`
        );
      }

      userRecords.push({
        name: expected.name,
        email: expected.email,
        role: expected.role,
        status: expected.status,
        passwordHash: await passwordHasher(supplied.password),
      });
    }

    const createdUsers = await transaction.createUsers(userRecords);
    const manager = createdUsers.find(
      (user) => user.role === USER_ROLES.PROCUREMENT_MANAGER
    );

    if (!manager) {
      throw new DemoDataSeedError("Demo Procurement Manager creation failed");
    }

    const createdSuppliers = await transaction.createSuppliers(
      DEMO_SUPPLIERS.map((supplier) => ({
        ...supplier,
        createdBy: manager._id,
      }))
    );
    const evaluations = buildDemoEvaluations({
      kpis: initialState.kpis,
      suppliers: createdSuppliers,
      evaluatorId: manager._id,
    });

    await transaction.createEvaluations(evaluations);

    const finalState = await transaction.inspect();

    if (!isIntendedDemoState(finalState)) {
      throw new DemoDataSeedError(
        "Demo data verification failed; no changes were committed"
      );
    }

    return { status: "SEEDED", counts: finalState.counts };
  });
}
