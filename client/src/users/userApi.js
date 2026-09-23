import { api, ApiError } from '../api/client.js'

const LOOKUP_PAGE_SIZE = 100

export async function loadUserById(userId, signal) {
  let page = 1

  while (true) {
    const response = await api.get('/users', {
      query: { page, limit: LOOKUP_PAGE_SIZE },
      signal,
    })
    const user = response.users.find((item) => item._id === userId)

    if (user) return user
    if (page >= response.pagination.totalPages) break
    page += 1
  }

  throw new ApiError('User not found', { status: 404 })
}
