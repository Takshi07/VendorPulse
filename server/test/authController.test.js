import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import {
  login,
  logout,
} from "../src/controllers/authController.js";
import { verifySessionToken } from "../src/domain/auth.js";
import User from "../src/models/User.js";

function responseRecorder() {
  return {
    statusCode: 200,
    payload: null,
    cookieCall: null,
    clearCookieCall: null,
    status(value) {
      this.statusCode = value;
      return this;
    },
    json(value) {
      this.payload = value;
      return this;
    },
    cookie(name, value, options) {
      this.cookieCall = { name, value, options };
      return this;
    },
    clearCookie(name, options) {
      this.clearCookieCall = { name, options };
      return this;
    },
  };
}

function stubFindOne(user) {
  const originalFindOne = User.findOne;
  User.findOne = () => ({
    select: async () => user,
  });
  return () => {
    User.findOne = originalFindOne;
  };
}

async function withTestJwtSecret(callback) {
  const originalSecret = process.env.JWT_SECRET;
  const originalEnvironment = process.env.NODE_ENV;
  process.env.JWT_SECRET = randomBytes(32).toString("hex");
  process.env.NODE_ENV = "test";

  try {
    await callback();
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
    if (originalEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnvironment;
  }
}

test("valid login issues an HttpOnly session and returns only public user fields", async () => {
  await withTestJwtSecret(async () => {
    const password = ["fixture", "login", "password"].join("-");
    const user = {
      _id: new mongoose.Types.ObjectId(),
      name: "Fixture Admin",
      email: "fixture-admin@example.invalid",
      passwordHash: await bcrypt.hash(password, 4),
      role: "ADMIN",
      status: "ACTIVE",
    };
    const restoreFindOne = stubFindOne(user);
    const response = responseRecorder();

    try {
      await login(
        {
          body: {
            email: "  FIXTURE-ADMIN@EXAMPLE.INVALID ",
            password,
          },
        },
        response,
        (error) => assert.fail(error)
      );
    } finally {
      restoreFindOne();
    }

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.payload.user, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    assert.equal(JSON.stringify(response.payload).includes("passwordHash"), false);
    assert.equal(response.cookieCall.name, "vp_session");
    assert.equal(response.cookieCall.options.httpOnly, true);
    assert.equal(response.cookieCall.options.sameSite, "lax");
    assert.equal(response.cookieCall.options.secure, false);
    assert.equal(response.cookieCall.options.maxAge, 8 * 60 * 60 * 1000);
    assert.equal(
      verifySessionToken(response.cookieCall.value).sub,
      String(user._id)
    );
  });
});

test("invalid credentials and inactive accounts do not issue sessions", async () => {
  await withTestJwtSecret(async () => {
    const activePassword = ["active", "fixture", "password"].join("-");
    const activeUser = {
      _id: new mongoose.Types.ObjectId(),
      name: "Active Fixture",
      email: "active@example.invalid",
      passwordHash: await bcrypt.hash(activePassword, 4),
      role: "VIEWER",
      status: "ACTIVE",
    };
    let restoreFindOne = stubFindOne(activeUser);
    const invalidResponse = responseRecorder();

    try {
      await login(
        {
          body: {
            email: activeUser.email,
            password: `${activePassword}-wrong`,
          },
        },
        invalidResponse,
        (error) => assert.fail(error)
      );
    } finally {
      restoreFindOne();
    }

    assert.equal(invalidResponse.statusCode, 401);
    assert.equal(invalidResponse.cookieCall, null);

    restoreFindOne = stubFindOne({
      ...activeUser,
      status: "INACTIVE",
    });
    const inactiveResponse = responseRecorder();

    try {
      await login(
        {
          body: {
            email: activeUser.email,
            password: activePassword,
          },
        },
        inactiveResponse,
        (error) => assert.fail(error)
      );
    } finally {
      restoreFindOne();
    }

    assert.equal(inactiveResponse.statusCode, 403);
    assert.equal(inactiveResponse.cookieCall, null);
  });
});

test("logout clears the session cookie using matching security attributes", () => {
  const response = responseRecorder();
  logout({}, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.clearCookieCall, {
    name: "vp_session",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  });
});
