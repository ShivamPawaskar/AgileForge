import { useEffect, useState } from 'react'
import { BriefcaseBusiness, CheckSquare2, ListTodo, Search, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { projectApi } from '../services/api'

const contains = (value, query) => String(value || '').toLowerCase().includes(query)
const typeIcon = { project: BriefcaseBusiness, story: ListTodo, task: CheckSquare2, member: UsersRound }

export default function GlobalSearch() {
  const { projects, selectedProject, tasks, setProject, setSprint } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const term = query.trim().toLowerCase()
    if (term.length < 2) { setResults([]); setLoading(false); return }
    let active = true
    const timer = window.setTimeout(async () => {
      setLoading(true)
      const projectResults = projects.filter(project => contains(project.name, term) || contains(project.description, term)).slice(0, 3).map(project => ({ type: 'project', id: project._id, title: project.name, detail: 'Project' }))
      const taskResults = tasks.filter(task => contains(task.title, term) || contains(task.description, term)).slice(0, 4).map(task => ({ type: 'task', id: task._id || task.id, title: task.title, detail: `Task · ${task.status || 'To do'}`, sprintId: task.sprintId?._id || task.sprintId }))
      const memberResults = (selectedProject?.members || []).map(member => member.userId || member).filter(person => contains(person.name, term) || contains(person.email, term)).slice(0, 3).map(person => ({ type: 'member', id: person._id, title: person.name, detail: `${person.email} · Team member` }))
      let storyResults = []
      if (selectedProject) {
        try {
          const stories = await projectApi.stories(selectedProject._id, { q: query.trim() })
          storyResults = stories.slice(0, 4).map(story => ({ type: 'story', id: story._id, title: story.title, detail: `${story.storyKey} · User story` }))
        } catch { storyResults = [] }
      }
      if (active) { setResults([...projectResults, ...storyResults, ...taskResults, ...memberResults].slice(0, 9)); setLoading(false) }
    }, 180)
    return () => { active = false; window.clearTimeout(timer) }
  }, [query, projects, selectedProject, tasks])

  const choose = item => {
    setQuery('')
    setOpen(false)
    if (item.type === 'project') { setProject(item.id); navigate('/'); return }
    if (item.type === 'task') { setSprint(item.sprintId || ''); navigate(`/board?q=${encodeURIComponent(item.title)}`); return }
    if (item.type === 'story') { navigate(`/backlog?q=${encodeURIComponent(item.title)}`); return }
    navigate('/team')
  }

  const submit = event => { event.preventDefault(); if (results[0]) choose(results[0]); else setOpen(true) }
  return <div className={`global-search ${open?'is-open':''}`}>
    <form className="searchbox" role="search" onSubmit={submit}>
      <Search className="global-search-icon" size={16}/><button type="button" className="global-search-mobile-trigger" aria-label="Open search" onClick={()=>{setOpen(true);window.setTimeout(()=>document.getElementById('global-search-input')?.focus(),0)}}><Search size={17}/></button><input id="global-search-input" aria-label="Search projects, stories, tasks, and members" value={query} onChange={event => { setQuery(event.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onBlur={()=>window.setTimeout(()=>setOpen(false),140)} onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }} placeholder="Search projects, stories, tasks…"/><kbd>Enter</kbd>
      <button type="submit" className="global-search-submit" aria-label="Search"><Search size={14}/></button>
      {query&&<button type="button" aria-label="Clear search" className="global-search-clear" onClick={()=>{setQuery('');setResults([]);setOpen(false)}}>×</button>}
    </form>
    {open&&query.trim().length>=2&&<div className="global-search-results">{loading?<div className="global-search-empty">Searching this workspace…</div>:results.length?results.map(item=>{const Icon=typeIcon[item.type];return <button type="button" className="global-search-result" key={`${item.type}-${item.id}`} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(item)}><span className={`global-search-icon ${item.type}`}><Icon size={14}/></span><span className="global-search-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><span className="global-search-enter">↵</span></button>}):<div className="global-search-empty">No matching projects, stories, tasks, or team members.</div>}</div>}
  </div>
}
