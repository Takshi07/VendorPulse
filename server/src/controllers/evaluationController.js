import {
  getEvaluationConfig,
  createEvaluation,
  listEvaluations,
  getEvaluationById,
} from "../services/evaluationService.js";

export async function getConfig(req, res, next) {
  try {
    const config = await getEvaluationConfig();

    return res.status(200).json(config);
  } catch (error) {
    next(error);
  }
}

export async function addEvaluation(req, res, next) {
  try {
    const evaluation = await createEvaluation(
      req.body,
      req.user._id
    );

    return res.status(201).json({
      evaluation,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEvaluations(req, res, next) {
  try {
    const result = await listEvaluations({
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

export async function getEvaluation(req, res, next) {
  try {
    const evaluation = await getEvaluationById(
      req.params.id
    );

    return res.status(200).json({
      evaluation,
    });
  } catch (error) {
    next(error);
  }
}