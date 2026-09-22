import {
  getDashboardData,
} from "../services/dashboardService.js";

export async function getDashboard(req, res, next) {
  try {
    const data = await getDashboardData({
      year: req.query.year,
      quarter: req.query.quarter,
    });

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}