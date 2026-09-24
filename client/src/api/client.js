const API_ROOT = '/api'

export class ApiError extends Error {
  constructor(message, { status = 0, code, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function toQueryString(params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return

    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item))
      return
    }

    query.set(key, value)
  })

  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

async function parseResponse(response) {
  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return response.json()
  return response.text()
}

export async function apiRequest(path, options = {}) {
  const { query, headers, body, ...requestOptions } = options
  const hasBody = body !== undefined
  const isFormData = body instanceof FormData
  const response = await fetch(`${API_ROOT}${path}${toQueryString(query)}`, {
    ...requestOptions,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: hasBody && !isFormData ? JSON.stringify(body) : body,
  })

  const payload = await parseResponse(response)

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload?.message
        ? payload.message
        : 'The request could not be completed.'

    throw new ApiError(message, {
      status: response.status,
      code: payload?.code,
      details: payload,
    })
  }

  return payload
}

export const api = {
  get: (path, options = {}) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => apiRequest(path, { ...options, method: 'POST', body }),
  patch: (path, body, options = {}) => apiRequest(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options = {}) => apiRequest(path, { ...options, method: 'PUT', body }),
  download: downloadApiFile,
}

export function getApiUrl(path, query) {
  return `${API_ROOT}${path}${toQueryString(query)}`
}

async function downloadApiFile(path, {
  query,
  filename,
  accept = 'application/octet-stream',
} = {}) {
  const response = await fetch(getApiUrl(path, query), {
    credentials: 'include',
    headers: { Accept: accept },
  })

  if (!response.ok) {
    const payload = await parseResponse(response)
    throw new ApiError(
      typeof payload === 'object' && payload?.message
        ? payload.message
        : 'The export could not be completed.',
      {
        status: response.status,
        code: payload?.code,
        details: payload,
      },
    )
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('content-disposition') || ''
  const headerFilename = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1]
  const downloadName = filename || headerFilename || 'download'
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = downloadName
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)

  return { filename: downloadName, size: blob.size }
}
