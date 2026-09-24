import assert from "node:assert/strict";
import test from "node:test";

import mongoose from "mongoose";

import Evaluation from "../src/models/Evaluation.js";
import { compareSuppliers } from "../src/services/comparisonService.js";

function evaluation({ supplierId, signature }) {
  return {
    supplierId: {
      _id: new mongoose.Types.ObjectId(supplierId),
      supplierName: "Fixture supplier",
    },
    year: 2026,
    quarter: 3,
    criteriaSignature: signature,
    overallScore: 4,
    performanceRating: "EXCELLENT",
    riskLevel: "LOW",
    scores: [],
  };
}

test("comparison rejects evaluations saved with incompatible criteria", async () => {
  const supplierIds = [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
  ];
  const originalFind = Evaluation.find;

  Evaluation.find = () => ({
    populate: async () => [
      evaluation({
        supplierId: supplierIds[0],
        signature: "criteria-one",
      }),
      evaluation({
        supplierId: supplierIds[1],
        signature: "criteria-two",
      }),
    ],
  });

  try {
    await assert.rejects(
      compareSuppliers({
        supplierIds,
        year: 2026,
        quarter: 3,
      }),
      (error) => {
        assert.equal(error.status, 409);
        assert.equal(error.code, "INCOMPATIBLE_CRITERIA");
        return true;
      }
    );
  } finally {
    Evaluation.find = originalFind;
  }
});

test("comparison validates supplier count and distinct IDs before querying", async () => {
  const supplierId = "507f1f77bcf86cd799439011";

  await assert.rejects(
    compareSuppliers({
      supplierIds: [supplierId],
      year: 2026,
      quarter: 3,
    }),
    /Exactly 2 or 3 suppliers are required/
  );

  await assert.rejects(
    compareSuppliers({
      supplierIds: [supplierId, supplierId],
      year: 2026,
      quarter: 3,
    }),
    /Suppliers must be distinct/
  );
});
