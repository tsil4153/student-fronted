import { useEffect, useState } from 'react'
import * as api from './api'

const PAGE_SIZE = 5
const EMPTY_FORM = { firstName: '', lastName: '', email: '', dateOfBirth: '' }

export default function App() {
  const [health, setHealth] = useState('checking...')
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const refresh = () => setReloadKey((key) => key + 1)

  useEffect(() => {
    api
      .checkHealth()
      .then((res) => setHealth(res.status))
      .catch(() => setHealth('unreachable'))
  }, [])

  useEffect(() => {
    api
      .listStudents(PAGE_SIZE, offset)
      .then(({ data, pagination }) => {
        setStudents(data)
        setTotal(pagination.total)
      })
      .catch((err) => setError(err.message))
  }, [offset, reloadKey])

  async function run(action) {
    setError('')
    try {
      await action()
    } catch (err) {
      setError(err.message)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const payload = { ...form, dateOfBirth: form.dateOfBirth || null }

    run(async () => {
      if (editingId) {
        await api.updateStudent(editingId, payload)
      } else {
        await api.createStudent(payload)
      }
      resetForm()
      refresh()
    })
  }

  function startEdit(student) {
    setEditingId(student.id)
    setForm({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      dateOfBirth: student.dateOfBirth ?? '',
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  function handleView(id) {
    run(async () => setSelected(await api.getStudent(id)))
  }

  function handleDelete(id) {
    if (!confirm('Delete this student?')) return
    run(async () => {
      await api.deleteStudent(id)
      if (selected?.id === id) setSelected(null)
      if (editingId === id) resetForm()
      if (students.length === 1 && offset > 0) {
        setOffset(offset - PAGE_SIZE)
      } else {
        refresh()
      }
    })
  }

  const updateField = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  return (
    <main>
      <header>
        <h1>Students</h1>
        <span className={`health ${health === 'ok' ? 'ok' : 'down'}`}>API: {health}</span>
      </header>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <h2>{editingId ? 'Edit student' : 'Add student'}</h2>
        <input placeholder="First name" value={form.firstName} onChange={updateField('firstName')} required />
        <input placeholder="Last name" value={form.lastName} onChange={updateField('lastName')} required />
        <input type="email" placeholder="Email" value={form.email} onChange={updateField('email')} required />
        <input type="date" value={form.dateOfBirth} onChange={updateField('dateOfBirth')} />
        <div className="actions">
          <button type="submit">{editingId ? 'Save' : 'Add'}</button>
          {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <section>
        <h2>All students ({total})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Date of birth</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.firstName} {student.lastName}</td>
                <td>{student.email}</td>
                <td>{student.dateOfBirth ?? '-'}</td>
                <td className="actions">
                  <button onClick={() => handleView(student.id)}>View</button>
                  <button onClick={() => startEdit(student)}>Edit</button>
                  <button onClick={() => handleDelete(student.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4}>No students yet.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="pagination">
          <button disabled={offset === 0} onClick={() => setOffset(offset - PAGE_SIZE)}>Previous</button>
          <span>
            {total === 0 ? 0 : offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of {total}
          </span>
          <button disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>Next</button>
        </div>
      </section>

      {selected && (
        <section>
          <h2>Student details</h2>
          <pre>{JSON.stringify(selected, null, 2)}</pre>
          <button onClick={() => setSelected(null)}>Close</button>
        </section>
      )}
    </main>
  )
}
