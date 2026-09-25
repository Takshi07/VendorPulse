import assert from "node:assert/strict";
import test from "node:test";

import bcrypt from "bcryptjs";

import User from "../src/models/User.js";
import {
  BASELINE_KPIS,
  DatabaseInitializationError,
  getExplicitDatabaseName,
  getInitialAdminCredentials,
  initializeDatabase,
} from "../src/services/databaseInitializationService.js";

const ADMIN_ID = "507f1f77bcf86cd799439011";

function emptyState() {
  return {
    users: [],
    suppliers: [],
    kpis: [],
    evaluations: [],
  };
}

function countsFor(state) {
  return {
    users: state.users.length,
    suppliers: state.suppliers.length,
    kpis: state.kpis.length,
    evaluations: state.evaluations.length,
  };
}

class MemoryInitializationRepository {
  constructor(state = emptyState(), { failKpiCreation = false } = {}) {
    this.state = structuredClone(state);
    this.failKpiCreation = failKpiCreation;
  }

  async withTransaction(operation) {
    const snapshot = structuredClone(this.state);

    try {
      return await operation({
        inspect: async () => ({
          counts: countsFor(this.state),
          users: structuredClone(this.state.users),
          kpis: structuredClone(this.state.kpis),
        }),
        createAdmin: async (data) => {
          const admin = { _id: ADMIN_ID, ...data };
          this.state.users.push(admin);
          return structuredClone(admin);
        },
        createKpis: async (data) => {
          if (this.failKpiCreation) {
            throw new Error("Simulated persistence failure");
          }

          this.state.kpis.push(
            ...data.map((kpi, index) => ({
              _id: `507f1f77bcf86cd79943901${index + 2}`,
              ...kpi,
            }))
          );
        },
      });
    } catch (error) {
      this.state = snapshot;
      throw error;
    }
  }
}

function initialAdminEnvironment() {
  return {
    INITIAL_ADMIN_NAME: "Priya Nair",
    INITIAL_ADMIN_EMAIL: "priya.nair@example.com",
    INITIAL_ADMIN_PASSWORD: ["Harbor", "Cedar", "84"].join("-"),
  };
}

function databaseUri(path = "") {
  const scheme = "mongodb+srv";
  return `${scheme}://cluster.example.invalid${path}`;
}

test("empty database initializes exactly one Admin and the approved KPI baseline", async () => {
  const environment = initialAdminEnvironment();
  const credentials = getInitialAdminCredentials(environment);
  const repository = new MemoryInitializationRepository();

  const result = await initializeDatabase({ repository, credentials });

  assert.equal(result.status, "INITIALIZED");
  assert.deepEqual(result.counts, {
    users: 1,
    suppliers: 0,
    kpis: 3,
    evaluations: 0,
  });
  assert.equal(result.totalActiveKpiWeight, 100);
  assert.equal(repository.state.users[0].role, "ADMIN");
  assert.equal(repository.state.users[0].status, "ACTIVE");
  assert.equal(
    await bcrypt.compare(
      credentials.password,
      repository.state.users[0].passwordHash
    ),
    true
  );
  assert.equal(
    repository.state.users[0].passwordHash === credentials.password,
    false
  );
  assert.deepEqual(
    repository.state.kpis.map(({ name, weight, status }) => ({
      name,
      weight,
      status,
    })),
    BASELINE_KPIS
  );

  const serializedAdmin = new User(repository.state.users[0]).toJSON();
  assert.equal("passwordHash" in serializedAdmin, false);
});

test("rerunning against the exact approved baseline is idempotent", async () => {
  const credentials = getInitialAdminCredentials(initialAdminEnvironment());
  const repository = new MemoryInitializationRepository();

  await initializeDatabase({ repository, credentials });
  const firstState = structuredClone(repository.state);
  const secondResult = await initializeDatabase({ repository, credentials });

  assert.equal(secondResult.status, "ALREADY_INITIALIZED");
  assert.deepEqual(repository.state, firstState);
  assert.deepEqual(secondResult.counts, {
    users: 1,
    suppliers: 0,
    kpis: 3,
    evaluations: 0,
  });
});

test("unexpected or partially populated application data aborts without writes", async () => {
  const credentials = getInitialAdminCredentials(initialAdminEnvironment());
  const existingState = emptyState();
  existingState.users.push({
    _id: ADMIN_ID,
    name: "Ananya Rao",
    email: "ananya.rao@example.com",
    role: "VIEWER",
    status: "ACTIVE",
  });
  const repository = new MemoryInitializationRepository(existingState);

  await assert.rejects(
    initializeDatabase({ repository, credentials }),
    (error) => {
      assert.equal(error instanceof DatabaseInitializationError, true);
      assert.match(error.message, /unexpected application data/);
      return true;
    }
  );

  assert.deepEqual(repository.state, existingState);
});

test("baseline recognition rejects duplicate KPIs or an invalid Admin hash", async () => {
  const credentials = getInitialAdminCredentials(initialAdminEnvironment());
  const initializedRepository = new MemoryInitializationRepository();
  await initializeDatabase({
    repository: initializedRepository,
    credentials,
  });

  const duplicateKpiState = structuredClone(initializedRepository.state);
  duplicateKpiState.kpis[2].name = duplicateKpiState.kpis[0].name;

  await assert.rejects(
    initializeDatabase({
      repository: new MemoryInitializationRepository(duplicateKpiState),
      credentials,
    }),
    /unexpected application data/
  );

  const invalidHashState = structuredClone(initializedRepository.state);
  invalidHashState.users[0].passwordHash = "not-a-valid-hash";

  await assert.rejects(
    initializeDatabase({
      repository: new MemoryInitializationRepository(invalidHashState),
      credentials,
    }),
    /unexpected application data/
  );
});

test("transaction rollback prevents a partial Admin-only initialization", async () => {
  const credentials = getInitialAdminCredentials(initialAdminEnvironment());
  const repository = new MemoryInitializationRepository(emptyState(), {
    failKpiCreation: true,
  });

  await assert.rejects(
    initializeDatabase({ repository, credentials }),
    /Simulated persistence failure/
  );

  assert.deepEqual(repository.state, emptyState());
});

test("configuration requires valid bootstrap values and an explicit database name", () => {
  assert.throws(
    () => getInitialAdminCredentials({}),
    /INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD are required/
  );
  assert.throws(
    () =>
      getInitialAdminCredentials({
        ...initialAdminEnvironment(),
        INITIAL_ADMIN_EMAIL: "invalid-address",
      }),
    /valid email address/
  );
  assert.throws(
    () => getExplicitDatabaseName(databaseUri()),
    /explicit target database name/
  );
  assert.equal(
    getExplicitDatabaseName(
      databaseUri("/vendorpulse?retryWrites=true")
    ),
    "vendorpulse"
  );
});
