import mongoose from "mongoose";

import Supplier from "../models/Supplier.js";
import { SUPPLIER_STATUS } from "../domain/constants.js";

function optionalString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = String(value).trim();

  return trimmed || undefined;
}

export async function createSupplier(data, createdBy) {
  const {
    supplierName,
    contactPerson,
    email,
    phone,
    category,
    address,
    taxId,
    contractStart,
    contractEnd,
  } = data;

  if (!supplierName?.trim()) {
    const error = new Error("Supplier name is required");
    error.status = 400;
    throw error;
  }

  if (!category?.trim()) {
    const error = new Error("Supplier category is required");
    error.status = 400;
    throw error;
  }

  if (contractStart && contractEnd) {
    const start = new Date(contractStart);
    const end = new Date(contractEnd);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      const error = new Error("Invalid contract date");
      error.status = 400;
      throw error;
    }

    if (end < start) {
      const error = new Error(
        "Contract end date cannot be before contract start date"
      );
      error.status = 400;
      throw error;
    }
  }

  const supplier = await Supplier.create({
    supplierName: supplierName.trim(),
    contactPerson: optionalString(contactPerson),
    email: optionalString(email),
    phone: optionalString(phone),
    category: category.trim(),
    address: optionalString(address),
    taxId: optionalString(taxId),
    contractStart: contractStart || undefined,
    contractEnd: contractEnd || undefined,
    status: SUPPLIER_STATUS.ACTIVE,
    createdBy,
});

  return supplier;
}

export async function getSupplierById(id) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid supplier ID");
    error.status = 400;
    throw error;
  }

  const supplier = await Supplier.findById(id);

  if (!supplier) {
    const error = new Error("Supplier not found");
    error.status = 404;
    throw error;
  }

  return supplier;
}

export async function listSuppliers({
  page = 1,
  limit = 10,
  search,
  status,
  category,
}) {
  const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1);

  const limitNumber = Math.min(
    Math.max(Number.parseInt(limit, 10) || 10, 1),
    100
  );

  const filter = {};

  if (status) {
    if (!Object.values(SUPPLIER_STATUS).includes(status)) {
      const error = new Error("Invalid supplier status");
      error.status = 400;
      throw error;
    }

    filter.status = status;
  }

  if (category?.trim()) {
    filter.category = category.trim();
  }

  if (search?.trim()) {
    const escapedSearch = search
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const searchRegex = new RegExp(escapedSearch, "i");

    filter.$or = [
      { supplierName: searchRegex },
      { contactPerson: searchRegex },
      { email: searchRegex },
      { taxId: searchRegex },
    ];
  }

  const skip = (pageNumber - 1) * limitNumber;

  const [suppliers, total] = await Promise.all([
    Supplier.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),

    Supplier.countDocuments(filter),
  ]);

  return {
    suppliers,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

export async function updateSupplier(id, data) {
  const supplier = await getSupplierById(id);

  const allowedFields = [
    "supplierName",
    "contactPerson",
    "email",
    "phone",
    "category",
    "address",
    "taxId",
    "contractStart",
    "contractEnd",
  ];

  const optionalStringFields = [
  "contactPerson",
  "email",
  "phone",
  "address",
  "taxId",
];

for (const field of allowedFields) {
  if (data[field] === undefined) {
    continue;
  }

  if (optionalStringFields.includes(field)) {
    supplier[field] = optionalString(data[field]);
  } else if (
    field === "contractStart" ||
    field === "contractEnd"
  ) {
    supplier[field] = data[field] || undefined;
  } else {
    supplier[field] = data[field];
  }
}

  if (!supplier.supplierName?.trim()) {
    const error = new Error("Supplier name is required");
    error.status = 400;
    throw error;
  }

  if (!supplier.category?.trim()) {
    const error = new Error("Supplier category is required");
    error.status = 400;
    throw error;
  }

  if (supplier.contractStart && supplier.contractEnd) {
    if (supplier.contractEnd < supplier.contractStart) {
      const error = new Error(
        "Contract end date cannot be before contract start date"
      );
      error.status = 400;
      throw error;
    }
  }

  supplier.supplierName =
    supplier.supplierName.trim();

  supplier.category =
    supplier.category.trim();
    
  await supplier.save();

  return supplier;
}

export async function archiveSupplier(id) {
  const supplier = await getSupplierById(id);

  if (supplier.status === SUPPLIER_STATUS.ARCHIVED) {
    return supplier;
  }

  supplier.status = SUPPLIER_STATUS.ARCHIVED;

  await supplier.save();

  return supplier;
}