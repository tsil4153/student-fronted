const BASE_URL = '/api'

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (response.status === 204) return null

  const body = await response.json()
  if (!response.ok) {
    const fieldErrors = body.details?.fieldErrors
    const detail = fieldErrors
      ? Object.entries(fieldErrors).map(([field, msgs]) => `${field}: ${msgs.join(', ')}`).join('; ')
      : ''
    throw new Error(detail ? `${body.error} (${detail})` : body.error)
  }
  return body
}

export const checkHealth = () => request('/health')

export const listStudents = (limit, offset) =>
  request(`/students?limit=${limit}&offset=${offset}`)

export const getStudent = (id) => request(`/students/${id}`).then((res) => res.data)

export const createStudent = (student) =>
  request('/students', { method: 'POST', body: JSON.stringify(student) }).then((res) => res.data)

export const updateStudent = (id, changes) =>
  request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(changes) }).then((res) => res.data)

export const deleteStudent = (id) => request(`/students/${id}`, { method: 'DELETE' })
