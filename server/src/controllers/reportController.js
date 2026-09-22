import {
  getEvaluationReport,
  getEvaluationReportCsv,
} from "../services/reportService.js";

export async function getReport(
  req,
  res,
  next
) {
  try {
    const result = await getEvaluationReport({
      page: req.query.page,
      limit: req.query.limit,
      supplierId: req.query.supplierId,
      year: req.query.year,
      quarter: req.query.quarter,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function exportReportCsv(
  req,
  res,
  next
) {
  try {
    const csv = await getEvaluationReportCsv({
      supplierId: req.query.supplierId,
      year: req.query.year,
      quarter: req.query.quarter,
    });

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="vendorpulse-evaluations.csv"'
    );

    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}