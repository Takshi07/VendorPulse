import { KPI_STATUS, USER_ROLES, USER_STATUS } from "../domain/constants.js";
import { validateActiveKpiWeights } from "../domain/kpiRules.js";
import {
  hashPassword,
  isPasswordHash,
} from "../domain/passwords.js";

export const BASELINE_KPIS = Object.freeze([
  Object.freeze({
    name: "Quality",
    weight: 45,
    status: KPI_STATUS.ACTIVE,
  }),
  Object.freeze({
    name: "Delivery",
    weight: 30,
    status: KPI_STATUS.ACTIVE,
  }),
  Object.freeze({
    name: "Cost",
    weight: 25,
    status: KPI_STATUS.ACTIVE,
  }),
]);

export class DatabaseInitializationError extends Error {
  constructor(message) {
    super(message);
    this.name = "DatabaseInitializationError";
  }
}

export function getInitialAdminCredentials(environment) {
  const name = environment.INITIAL_ADMIN_NAME?.trim();
  const email = environment.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = environment.INITIAL_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new DatabaseInitializationError(
      "INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD are required"
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new DatabaseInitializationError(
      "INITIAL_ADMIN_EMAIL must be a valid email address"
    );
  }

  if (password.length < 8) {
    throw new DatabaseInitializationError(
      "INITIAL_ADMIN_PASSWORD must be at least 8 characters"
    );
  }

  return { name, email, password };
}

export function getExplicitDatabaseName(uri) {
  if (!uri) {
    throw new DatabaseInitializationError("MONGODB_URI is required");
  }

  let parsed;

  try {
    parsed = new URL(uri);
  } catch {
    throw new DatabaseInitializationError("MONGODB_URI is invalid");
  }

  const databaseName = decodeURIComponent(
    parsed.pathname.replace(/^\//, "")
  ).trim();

  if (!databaseName || databaseName.includes("/")) {
    throw new DatabaseInitializationError(
      "MONGODB_URI must include one explicit target database name"
    );
  }

  return databaseName;
}

function hasExpectedCounts(counts, expected) {
  return Object.entries(expected).every(
    ([key, value]) => counts[key] === value
  );
}

function isExpectedBaseline(state, credentials) {
  if (
    !hasExpectedCounts(state.counts, {
      users: 1,
      suppliers: 0,
      kpis: BASELINE_KPIS.length,
      evaluations: 0,
    }) ||
    state.users.length !== 1 ||
    state.kpis.length !== BASELINE_KPIS.length
  ) {
    return false;
  }

  const [admin] = state.users;

  if (
    admin.name !== credentials.name ||
    admin.email !== credentials.email ||
    admin.role !== USER_ROLES.ADMIN ||
    admin.status !== USER_STATUS.ACTIVE ||
    !isPasswordHash(admin.passwordHash)
  ) {
    return false;
  }

  const storedByName = new Map(
    state.kpis.map((kpi) => [kpi.name, kpi])
  );

  if (storedByName.size !== BASELINE_KPIS.length) {
    return false;
  }

  return BASELINE_KPIS.every((expected) => {
    const kpi = storedByName.get(expected.name);

    return Boolean(
      kpi &&
      Number(kpi.weight) === expected.weight &&
      kpi.status === expected.status &&
      String(kpi.createdBy) === String(admin._id)
    );
  });
}

export function classifyInitializationState(state, credentials) {
  if (
    hasExpectedCounts(state.counts, {
      users: 0,
      suppliers: 0,
      kpis: 0,
      evaluations: 0,
    })
  ) {
    return "EMPTY";
  }

  if (isExpectedBaseline(state, credentials)) {
    return "INITIALIZED";
  }

  return "UNEXPECTED";
}

export async function initializeDatabase({
  repository,
  credentials,
  passwordHasher = hashPassword,
}) {
  const weightValidation = validateActiveKpiWeights(BASELINE_KPIS);

  if (!weightValidation.valid) {
    throw new DatabaseInitializationError(
      `Baseline KPI configuration is invalid: ${weightValidation.message}`
    );
  }

  return repository.withTransaction(async (transaction) => {
    const initialState = await transaction.inspect();
    const classification = classifyInitializationState(
      initialState,
      credentials
    );

    if (classification === "INITIALIZED") {
      return {
        status: "ALREADY_INITIALIZED",
        counts: initialState.counts,
        totalActiveKpiWeight: weightValidation.total,
      };
    }

    if (classification === "UNEXPECTED") {
      throw new DatabaseInitializationError(
        "Database contains unexpected application data; initialization was aborted without changes"
      );
    }

    const passwordHash = await passwordHasher(credentials.password);
    const admin = await transaction.createAdmin({
      name: credentials.name,
      email: credentials.email,
      passwordHash,
      role: USER_ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    });

    await transaction.createKpis(
      BASELINE_KPIS.map((kpi) => ({
        ...kpi,
        createdBy: admin._id,
      }))
    );

    const finalState = await transaction.inspect();

    if (!isExpectedBaseline(finalState, credentials)) {
      throw new DatabaseInitializationError(
        "Database initialization verification failed; no changes were committed"
      );
    }

    return {
      status: "INITIALIZED",
      counts: finalState.counts,
      totalActiveKpiWeight: weightValidation.total,
    };
  });
}
