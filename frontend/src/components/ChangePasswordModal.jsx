import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import Modal from './Modal'
import api from '../api'

export default function ChangePasswordModal({ open, onClose }) {
  const { t } = useTranslation('auth')
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.currentPassword) e.currentPassword = t('password_required')
    if (form.newPassword.length < 8 || form.newPassword.length > 128)
      e.newPassword = t('password_min_length')
    if (form.confirmPassword !== form.newPassword)
      e.confirmPassword = t('passwords_dont_match')
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      await api.put('/auth/password', form)
      toast.success(t('password_changed'))
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setErrors({})
      onClose()
    } catch (err) {
      if (err.response?.status === 401) {
        setErrors({ currentPassword: t('current_password_wrong') })
      } else {
        toast.error(err.response?.data?.error || t('error_changing_password'))
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
    { key: 'currentPassword', labelKey: 'current_password' },
    { key: 'newPassword',     labelKey: 'new_password' },
    { key: 'confirmPassword', labelKey: 'confirm_password' },
  ]

  return (
    <Modal open={open} onClose={handleClose} title={t('change_password')}
      footer={
        <div className="flex gap-2 justify-end">
          <button onClick={handleClose} className="btn-secondary">{t('cancel', { ns: 'common' })}</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary">
            {loading ? t('saving') : t('change_password')}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {fields.map(({ key, labelKey }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t(labelKey)}
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
