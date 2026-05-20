import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import api from '../api'

export default function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.currentPassword) e.currentPassword = 'Informe a senha atual'
    if (form.newPassword.length < 8 || form.newPassword.length > 128)
      e.newPassword = 'A nova senha deve ter entre 8 e 128 caracteres'
    if (form.confirmPassword !== form.newPassword)
      e.confirmPassword = 'As senhas não coincidem'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      await api.put('/auth/password', form)
      toast.success('Senha alterada com sucesso!')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setErrors({})
      onClose()
    } catch (err) {
      if (err.response?.status === 401) {
        setErrors({ currentPassword: 'Senha atual incorreta' })
      } else {
        toast.error(err.response?.data?.error || 'Erro ao alterar senha')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setErrors({})
    onClose()
  }

  const fields = [
    { key: 'currentPassword', label: 'Senha atual' },
    { key: 'newPassword',     label: 'Nova senha' },
    { key: 'confirmPassword', label: 'Confirmar nova senha' },
  ]

  return (
    <Modal open={open} onClose={handleClose} title="Alterar senha"
      footer={
        <div className="flex gap-2 justify-end">
          <button onClick={handleClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary">
            {loading ? 'Salvando…' : 'Alterar senha'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {label}
            </label>
            <input
              type="password"
              value={form[key]}
              onChange={e => { set(key, e.target.value); setErrors(ev => ({ ...ev, [key]: undefined })) }}
              className={`input py-1.5 w-full${errors[key] ? ' border-red-500 focus:ring-red-500' : ''}`}
              autoComplete="current-password"
            />
            {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
          </div>
        ))}
      </div>
    </Modal>
  )
}
