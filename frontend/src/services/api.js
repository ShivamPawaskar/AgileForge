import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', headers: { 'Content-Type': 'application/json' } })
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('agileforge.token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
export const authApi = {
  register: async credentials => { const data = (await api.post('/auth/register', credentials)).data.data; sessionStorage.setItem('agileforge.token', data.token); return data },
  login: async credentials => { const data = (await api.post('/auth/login', credentials)).data.data; sessionStorage.setItem('agileforge.token', data.token); return data },
  me: async () => (await api.get('/auth/me')).data.data.user,
  logout: async () => { try { await api.post('/auth/logout') } finally { sessionStorage.removeItem('agileforge.token') } },
  updateProfile: async changes => (await api.patch('/auth/me', changes)).data.data.user,
}
export const projectApi = {
  list: async () => (await api.get('/projects')).data.data,
  create: async project => (await api.post('/projects', project)).data.data,
  get: async projectId => (await api.get(`/projects/${projectId}`)).data.data,
  update: async (projectId, changes) => (await api.patch(`/projects/${projectId}`, changes)).data.data,
  remove: async projectId => (await api.delete(`/projects/${projectId}`)).data,
  members: async projectId => (await api.get(`/projects/${projectId}/members`)).data.data,
  addMember: async (projectId, member) => (await api.post(`/projects/${projectId}/members`, member)).data.data,
  addManualMember: async (projectId, member) => (await api.post(`/projects/${projectId}/members/manual`, member)).data.data,
  updateMember: async (projectId, userId, changes) => (await api.patch(`/projects/${projectId}/members/${userId}`, changes)).data.data,
  removeMember: async (projectId, userId) => (await api.delete(`/projects/${projectId}/members/${userId}`)).data.data,
  tasks: async (projectId, params) => (await api.get(`/projects/${projectId}/tasks`, { params })).data.data.map(taskFromApi),
  createTask: async (projectId, task) => taskFromApi((await api.post(`/projects/${projectId}/tasks`, taskToApi(task))).data.data),
  updateTask: async (projectId, taskId, changes) => taskFromApi((await api.patch(`/projects/${projectId}/tasks/${taskId}`, taskToApi(changes))).data.data),
  deleteTask: async (projectId, taskId) => (await api.delete(`/projects/${projectId}/tasks/${taskId}`)).data.data,
  sprints: async projectId => (await api.get(`/projects/${projectId}/sprints`)).data.data,
  createSprint: async (projectId, sprint) => (await api.post(`/projects/${projectId}/sprints`, sprint)).data.data,
  updateSprint: async (projectId, sprintId, changes) => (await api.patch(`/projects/${projectId}/sprints/${sprintId}`, changes)).data.data,
  deleteSprint: async (projectId, sprintId) => (await api.delete(`/projects/${projectId}/sprints/${sprintId}`)).data.data,
  sprintMetrics: async (projectId, sprintId) => (await api.get(`/projects/${projectId}/sprints/${sprintId}/metrics`)).data.data,
  projectMetrics: async projectId => (await api.get(`/projects/${projectId}/metrics`)).data.data,
  readiness: async projectId => (await api.get(`/projects/${projectId}/readiness`)).data.data,
  testCases: async projectId => (await api.get(`/projects/${projectId}/test-cases`)).data.data,
  createTestCase: async (projectId, item) => (await api.post(`/projects/${projectId}/test-cases`, item)).data.data,
  updateTestCase: async (projectId, id, changes) => (await api.patch(`/projects/${projectId}/test-cases/${id}`, changes)).data.data,
  deleteTestCase: async (projectId, id) => (await api.delete(`/projects/${projectId}/test-cases/${id}`)).data.data,
  addStoryToSprint: async (projectId,sprintId,storyId) => (await api.put(`/projects/${projectId}/sprints/${sprintId}/stories/${storyId}`)).data.data,
  removeStoryFromSprint: async (projectId,sprintId,storyId) => (await api.delete(`/projects/${projectId}/sprints/${sprintId}/stories/${storyId}`)).data.data,
  stories: async (projectId,params) => (await api.get(`/projects/${projectId}/stories`,{params})).data.data,
  createStory: async (projectId,story) => (await api.post(`/projects/${projectId}/stories`,story)).data.data,
  updateStory: async (projectId,storyId,changes) => (await api.patch(`/projects/${projectId}/stories/${storyId}`,changes)).data.data,
  deleteStory: async (projectId,storyId) => (await api.delete(`/projects/${projectId}/stories/${storyId}`)).data.data,
}
const statusesFromApi = { todo: 'To do', in_progress: 'In progress', in_review: 'In review', done: 'Done' }
const statusesToApi = { 'To do': 'todo', 'In progress': 'in_progress', 'In review': 'in_review', Done: 'done' }
function taskFromApi(task) { return { ...task, id: task._id, status: statusesFromApi[task.status] || task.status, priority: task.priority?.[0]?.toUpperCase()+task.priority?.slice(1), type: task.type?.[0]?.toUpperCase()+task.type?.slice(1), assignee: task.assignedTo?.name || '', points: task.storyPoints || 0 } }
function taskToApi(task) {
  const result = { ...task }
  if (result.status && statusesToApi[result.status]) result.status = statusesToApi[result.status]
  if (result.priority) result.priority = result.priority.toLowerCase()
  if (result.type) result.type = result.type.toLowerCase()
  if (result.points !== undefined) { result.storyPoints = Number(result.points); delete result.points }
  if (result.assignedTo && typeof result.assignedTo === 'object') result.assignedTo = result.assignedTo._id
  delete result.assignee
  for (const key of ['id','_id','createdAt','updatedAt','statusHistory','projectId']) delete result[key]
  return result
}
export default api
