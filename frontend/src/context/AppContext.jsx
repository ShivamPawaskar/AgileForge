import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authApi, projectApi } from '../services/api'
export const AppContext = createContext(null)
export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectError, setProjectError] = useState('')
  const [sprints,setSprints]=useState([])
  const [sprintId,setSprintId]=useState('')
  const [team, setTeam] = useState('All team')
  const [tasks, setTasks] = useState([])
  const tasksRef = useRef([])
  const [toast, setToast] = useState('')
  const notify = useCallback(message => { setToast(message); window.clearTimeout(window.__afToast); window.__afToast = window.setTimeout(() => setToast(''), 2600) }, [])
  const refreshProjects = useCallback(async () => {
    if (!user) { setProjects([]); setProjectId(''); return }
    setProjectsLoading(true); setProjectError('')
    try {
      const data = await projectApi.list()
      setProjects(data)
      setProjectId(current => data.some(p => p._id === current) ? current : data[0]?._id || '')
    } catch (error) { setProjectError(error.response?.data?.message || 'Could not load projects') }
    finally { setProjectsLoading(false) }
  }, [user])
  const refreshTasks = useCallback(async () => {
    if (!user || !projectId) { tasksRef.current=[]; setTasks([]); return }
    try { const rows=await projectApi.tasks(projectId); tasksRef.current=rows; setTasks(rows) }
    catch (error) { notify(error.response?.data?.message || 'Could not load project tasks') }
  }, [user,projectId,notify])
  const refreshSprints=useCallback(async()=>{
    if(!user||!projectId){setSprints([]);setSprintId('');return}
    try{const rows=await projectApi.sprints(projectId);setSprints(rows);setSprintId(current=>rows.some(row=>row._id===current)?current:rows.find(row=>row.status==='active')?._id||rows[0]?._id||'')}
    catch(error){notify(error.response?.data?.message||'Could not load sprints')}
  },[user,projectId,notify])
  useEffect(() => {
    let active = true
    const token = sessionStorage.getItem('agileforge.token')
    if (!token) { setAuthLoading(false); return }
    authApi.me().then(value => { if (active) setUser(value) }).catch(() => { sessionStorage.removeItem('agileforge.token') }).finally(() => { if (active) setAuthLoading(false) })
    return () => { active = false }
  }, [])
  useEffect(() => { if (!authLoading) refreshProjects() }, [authLoading, refreshProjects])
  useEffect(() => { refreshTasks() }, [refreshTasks])
  useEffect(() => { refreshSprints() }, [refreshSprints])
  const selectedProject = projects.find(p => p._id === projectId) || null
  const selectedSprint=sprints.find(item=>item._id===sprintId)||null
  const updateTasks = useCallback(updater => {
    const prior=tasksRef.current
    const next=typeof updater==='function'?updater(prior):updater
    tasksRef.current=next
    setTasks(next)
    if (!user || !projectId || !Array.isArray(next)) return
    const pending=[]
    for (const item of next) {
      const old=prior.find(task=>task.id===item.id)
      const membership=selectedProject?.members?.find(member=>member.userId?.name===item.assignee)
      const payload={...item,assignedTo:item.assignedTo?._id||item.assignedTo||membership?.userId?._id||null}
      if(!old)pending.push(projectApi.createTask(projectId,payload))
      else if(old.status!==item.status||old.title!==item.title||old.priority!==item.priority||old.assignee!==item.assignee||old.points!==item.points||old.sprintId!==item.sprintId)pending.push(projectApi.updateTask(projectId,item.id,payload))
    }
    if(pending.length)Promise.all(pending).then(refreshTasks).catch(error=>notify(error.response?.data?.message||'Could not save task changes'))
  }, [user,projectId,selectedProject,refreshTasks,notify])
  const login = async (action, values) => { const result = await authApi[action](values); setUser(result.user); return result.user }
  const logout = async () => { try { await authApi.logout() } finally { setUser(null); setProjects([]); setProjectId('') } }
  const value = useMemo(() => ({ user,setUser,authLoading,login,logout,projects,setProjects,projectsLoading,projectError,refreshProjects,projectId,setProjectId,selectedProject,project:selectedProject?.name||'',setProject:setProjectId,sprint:selectedSprint?.name||'',setSprint:setSprintId,sprints,sprintId,selectedSprint,refreshSprints,team,setTeam,tasks,setTasks:updateTasks,refreshTasks,notify }), [user,authLoading,projects,projectsLoading,projectError,refreshProjects,projectId,selectedProject,sprintId,selectedSprint,sprints,refreshSprints,team,tasks,updateTasks,refreshTasks,notify])
  return <AppContext.Provider value={value}>{children}{toast && <div className="toast">{toast}</div>}</AppContext.Provider>
}
export const useApp = () => useContext(AppContext)
