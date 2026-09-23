import assert from "node:assert/strict";
import test from "node:test";

import User from "../src/models/User.js";

function userDocument(overrides = {}) {
  return new User({
    name: "Serialization Test",
    email: "serialization@example.invalid",
    passwordHash: "stored-hash-value",
    role: "VIEWER",
    status: "ACTIVE",
    ...overrides,
  });
}

test("User JSON keeps passwordHash private without removing it from the document", () => {
  const user = userDocument();

  assert.equal(user.get("passwordHash"), "stored-hash-value");
  assert.equal(Object.hasOwn(user.toJSON(), "passwordHash"), false);
  assert.equal(
    Object.hasOwn(JSON.parse(JSON.stringify(user)), "passwordHash"),
    false
  );
});

test("create, list and patch response shapes never serialize passwordHash", () => {
  const createResponse = { user: userDocument() };
  const listResponse = {
    users: [userDocument({ role: "ADMIN" })],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  };
  const patchResponse = {
    user: userDocument({
      name: "Updated Serialization Test",
      status: "INACTIVE",
    }),
  };

  for (const response of [
    createResponse,
    listResponse,
    patchResponse,
  ]) {
    const serialized = JSON.stringify(response);
    assert.equal(serialized.includes("passwordHash"), false);
    assert.equal(serialized.includes("stored-hash-value"), false);
  }
});

test("passwordHash remains excluded from User queries by default", () => {
  assert.equal(User.schema.path("passwordHash").options.select, false);
});
