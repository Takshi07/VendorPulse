import {
  compareSuppliers,
} from "../services/comparisonService.js";

export async function getComparison(
  req,
  res,
  next
) {
  try {
    const result = await compareSuppliers({
      supplierIds: req.query.supplierIds,
      year: req.query.year,
      quarter: req.query.quarter,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}