import {
  listKpis,
  getKpiById,
  createKpi,
  updateKpi,
  updateKpiWeights,
} from "../services/kpiService.js";

export async function getKpis(req, res, next) {
  try {
    const kpis = await listKpis({
      status: req.query.status,
    });

    return res.status(200).json({
      kpis,
    });
  } catch (error) {
    next(error);
  }
}

export async function getKpi(req, res, next) {
  try {
    const kpi = await getKpiById(req.params.id);

    return res.status(200).json({
      kpi,
    });
  } catch (error) {
    next(error);
  }
}

export async function addKpi(req, res, next) {
  try {
    const kpi = await createKpi(
      req.body,
      req.user._id
    );

    return res.status(201).json({
      kpi,
    });
  } catch (error) {
    next(error);
  }
}

export async function editKpi(req, res, next) {
  try {
    const kpi = await updateKpi(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      kpi,
    });
  } catch (error) {
    next(error);
  }
}

export async function adjustKpiWeights(req, res, next) {
  try {
    const result = await updateKpiWeights(
      req.body.updates
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}