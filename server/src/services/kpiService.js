import mongoose from "mongoose";
import { validateActiveKpiWeights } from "../domain/kpiRules.js";

import KPI from "../models/KPI.js";
import { KPI_STATUS } from "../domain/constants.js";

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function listKpis({ status } = {}) {
  const filter = {};

  if (status) {
    if (!Object.values(KPI_STATUS).includes(status)) {
      throw createError("Invalid KPI status", 400);
    }

    filter.status = status;
  }

  return KPI.find(filter).sort({
    createdAt: -1,
  });
}

export async function getKpiById(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid KPI ID", 400);
  }

  const kpi = await KPI.findById(id);

  if (!kpi) {
    throw createError("KPI not found", 404);
  }

  return kpi;
}

export async function createKpi(data, createdBy) {
  const { name, description, weight, status } = data;

  if (!name?.trim()) {
    throw createError("KPI name is required", 400);
  }

  const numericWeight = Number(weight);

  if (
    !Number.isFinite(numericWeight) ||
    numericWeight <= 0 ||
    numericWeight > 100
  ) {
    throw createError(
      "KPI weight must be greater than 0 and at most 100",
      400
    );
  }

  if (
    status &&
    !Object.values(KPI_STATUS).includes(status)
  ) {
    throw createError("Invalid KPI status", 400);
  }

  const kpi = await KPI.create({
    name: name.trim(),
    description,
    weight: numericWeight,
    status: status || KPI_STATUS.ACTIVE,
    createdBy,
  });

  return kpi;
}

export async function updateKpi(id, data) {
  const kpi = await getKpiById(id);

  if (data.name !== undefined) {
    if (!data.name?.trim()) {
      throw createError("KPI name is required", 400);
    }

    kpi.name = data.name.trim();
  }

  if (data.description !== undefined) {
    kpi.description = data.description;
  }

  if (data.weight !== undefined) {
    const numericWeight = Number(data.weight);

    if (
      !Number.isFinite(numericWeight) ||
      numericWeight <= 0 ||
      numericWeight > 100
    ) {
      throw createError(
        "KPI weight must be greater than 0 and at most 100",
        400
      );
    }

    kpi.weight = numericWeight;
  }

  if (data.status !== undefined) {
    if (!Object.values(KPI_STATUS).includes(data.status)) {
      throw createError("Invalid KPI status", 400);
    }

    kpi.status = data.status;
  }

  await kpi.save();

  return kpi;
}

export async function updateKpiWeights(updates) {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw createError("KPI weight updates are required", 400);
  }

  const ids = updates.map((item) => item.id);

  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw createError("Invalid KPI ID", 400);
  }

  if (new Set(ids).size !== ids.length) {
    throw createError("Duplicate KPI IDs are not allowed", 400);
  }

  const kpis = await KPI.find({
    _id: { $in: ids },
  });

  if (kpis.length !== ids.length) {
    throw createError("One or more KPIs were not found", 404);
  }

  for (const kpi of kpis) {
    const update = updates.find(
      (item) => item.id === kpi._id.toString()
    );

    const numericWeight = Number(update.weight);

    if (
      !Number.isFinite(numericWeight) ||
      numericWeight <= 0 ||
      numericWeight > 100
    ) {
      throw createError(
        "Each KPI weight must be greater than 0 and at most 100",
        400
      );
    }

    kpi.weight = numericWeight;
  }

  const allKpis = await KPI.find();

  const updatedWeights = new Map(
    kpis.map((kpi) => [
      kpi._id.toString(),
      kpi.weight,
    ])
  );

  for (const kpi of allKpis) {
    const newWeight = updatedWeights.get(kpi._id.toString());

    if (newWeight !== undefined) {
      kpi.weight = newWeight;
    }
  }

  const validation = validateActiveKpiWeights(allKpis);

  if (!validation.valid) {
    throw createError(validation.message, 400);
  }

  await Promise.all(
    kpis.map((kpi) => kpi.save())
  );

  return {
    kpis,
    totalActiveWeight: validation.total,
  };
}