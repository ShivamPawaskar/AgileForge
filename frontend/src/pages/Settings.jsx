import { useEffect, useRef, useState } from 'react'
import { Save } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { authApi } from '../services/api'
import SectionHeading from '../components/SectionHeading'
import Avatar from '../components/Avatar'

async function makeAvatarDataUrl(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG, or WebP image.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.')
  const source = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Could not read this image.')); reader.readAsDataURL(file) })
  const image = await new Promise((resolve, reject) => { const item = new Image(); item.onload = () => resolve(item); item.onerror = () => reject(new Error('This image could not be opened.')); item.src = source })
  for (const maxSize of [320, 256, 192]) {
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale))
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
    const output = canvas.toDataURL('image/jpeg', .7)
    if (output.length < 260000) return output
  }
  throw new Error('This photo could not be resized small enough. Choose another image.')
}

export default function Settings() {
  const { user, setUser, notify } = useApp()
  const photoInput = useRef(null)
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [photo, setPhoto] = useState(user?.avatarUrl || '')
  const [photoChanged, setPhotoChanged] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setName(user?.name || ''); setEmail(user?.email || ''); setPhoto(user?.avatarUrl || ''); setPhotoChanged(false) }, [user])

  const selectPhoto = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    try { setPhoto(await makeAvatarDataUrl(file)); setPhotoChanged(true) }
    catch (failure) { setError(failure.message || 'Could not use this image') }
  }

  const save = async event => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const changes = { name: name.trim(), email: email.trim() }
      if (photoChanged) changes.avatarUrl = photo
      const updated = await authApi.updateProfile(changes)
      setUser(updated); notify('Profile settings saved')
    } catch (failure) { setError(failure.response?.data?.message || 'Could not save profile settings') }
    finally { setBusy(false) }
  }

  return <div className="page-content subpage">
    <div className="subpage-title"><SectionHeading title="Settings" subtitle="Update the profile details used in your AgileForge workspace."/></div>
    <form className="panel settings-panel" onSubmit={save}>
      <h3>Profile</h3><p>Changes are saved to your account in MongoDB.</p>
      {error && <div className="inline-error" role="alert">{error}</div>}
      <div className="profile-photo-setting">
        <Avatar initials={(name || 'AF').split(' ').map(x => x[0]).slice(0, 2).join('')} color="violet" size="profile-large" avatarUrl={photo}/>
        <div className="profile-photo-copy"><strong>Profile photo</strong><small>PNG, JPEG, or WebP. Your photo is resized and saved with your profile.</small>{photoChanged && <span className="photo-pending">Photo change not saved yet</span>}</div>
        <div className="profile-photo-actions"><input ref={photoInput} className="visually-hidden-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={selectPhoto}/><button type="button" className="quiet-button" onClick={() => photoInput.current?.click()}>Change photo</button>{photo && <button type="button" className="photo-remove" onClick={() => { setPhoto(''); setPhotoChanged(true) }}>Remove</button>}</div>
      </div>
      <label className="setting-field">Full name<input required minLength={2} value={name} onChange={event => setName(event.target.value)}/></label>
      <label className="setting-field">Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)}/></label>
      <div className="settings-footer"><span>Account role: {user?.role || 'user'}</span><button className="primary-button" disabled={busy}><Save size={15}/>{busy ? 'Saving…' : 'Save profile'}</button></div>
    </form>
  </div>
}
