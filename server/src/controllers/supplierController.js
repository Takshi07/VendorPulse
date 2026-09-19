import {
  createSupplier,
  getSupplierById,
  listSuppliers,
  updateSupplier,
  archiveSupplier,
} from "../services/supplierService.js";

export async function getSuppliers(req, res, next) {
  try {
    const result = await listSuppliers({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status,
      category: req.query.category,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getSupplier(req, res, next) {
  try {
    const supplier = await getSupplierById(req.params.id);

    return res.status(200).json({
      supplier,
    });
  } catch (error) {
    next(error);
  }
}

export async function addSupplier(req, res, next) {
  try {
    const supplier = await createSupplier(
      req.body,
      req.user._id
    );

    return res.status(201).json({
      supplier,
    });
  } catch (error) {
    next(error);
  }
}

export async function editSupplier(req, res, next) {
  try {
    const supplier = await updateSupplier(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      supplier,
    });
  } catch (error) {
    next(error);
  }
}

export async function archiveSupplierById(req, res, next) {
  try {
    const supplier = await archiveSupplier(req.params.id);

    return res.status(200).json({
      supplier,
    });
  } catch (error) {
    next(error);
  }
}