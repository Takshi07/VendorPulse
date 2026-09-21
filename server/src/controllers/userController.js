import {
  listUsers,
  createUser,
  updateUser,
} from "../services/userService.js";

export async function getUsers(req, res, next) {
  try {
    const result = await listUsers({
      page: req.query.page,
      limit: req.query.limit,
      role: req.query.role,
      status: req.query.status,
      search: req.query.search,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function addUser(req, res, next) {
  try {
    const user = await createUser(req.body);

    return res.status(201).json({
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function editUser(req, res, next) {
  try {
    const user = await updateUser(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      user,
    });
  } catch (error) {
    next(error);
  }
}