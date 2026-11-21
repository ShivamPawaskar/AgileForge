import { useMemo } from 'react'

const CARD_W = 236
const CARD_H = 112
const COL_GAP = 304
const ROW_GAP = 142
const idOf = value => String(value?._id || value?.id || value || '')
const stateStyle = status => ({ done: { color: '#58d6a4', label: 'DONE' }, 'in progress': { color: '#70b5ff', label: 'IN PROGRESS' }, in_progress: { color: '#70b5ff', label: 'IN PROGRESS' }, review: { color: '#f0bf70', label: 'REVIEW' }, in_review: { color: '#f0bf70', label: 'REVIEW' }, 'to do': { color: '#9b9db5', label: 'TO DO' }, todo: { color: '#9b9db5', label: 'TO DO' } }[String(status || '').toLowerCase()] || { color: '#9b9db5', label: String(status || 'TO DO').toUpperCase() })
const wrapTitle = value => {
  const words = String(value || 'Untitled task').split(/\s+/)
  const lines = ['']
  for (const word of words) {
    const index = lines.length - 1
    if (lines[index] && `${lines[index]} ${word}`.length > 29 && lines.length < 2) lines.push(word)
    else if (lines[index].length < 32) lines[index] += `${lines[index] ? ' ' : ''}${word}`
  }
  return lines.map(line => line.length > 32 ? `${line.slice(0, 29)}…` : line)
}

function makeGraph(tasks) {
  const tasksById = new Map(tasks.map(task => [idOf(task), task]))
  const taskNodes = tasks.map(task => ({ id: `task:${idOf(task)}`, task, type: 'task', depth: 0 }))
  const nodeByTask = new Map(taskNodes.map(node => [idOf(node.task), node]))
  const edges = []
  const storyInfo = new Map()

  for (const task of tasks) {
    const story = task.userStoryId
    const storyId = idOf(story)
    if (storyId && storyId !== '[object Object]') {
      if (!storyInfo.has(storyId)) storyInfo.set(storyId, { id: `story:${storyId}`, title: story?.title || 'Linked user story', storyKey: story?.storyKey || '', type: 'story', depth: 0 })
      edges.push({ from: `story:${storyId}`, to: `task:${idOf(task)}`, type: 'story' })
      nodeByTask.get(idOf(task)).depth = 1
    }
  }

  const dependencies = []
  const externalDependencies = new Set()
  for (const task of tasks) {
    for (const dependency of task.dependencies || []) {
      const fromId = idOf(dependency)
      if (!fromId) continue
      if (tasksById.has(fromId)) {
        dependencies.push([fromId, idOf(task)])
        edges.push({ from: `task:${fromId}`, to: `task:${idOf(task)}`, type: 'dependency' })
      } else externalDependencies.add(fromId)
    }
  }

  // Assign each task to the earliest column after its visible prerequisites.
  for (let pass = 0; pass < taskNodes.length; pass += 1) {
    let changed = false
    for (const [fromId, toId] of dependencies) {
      const from = nodeByTask.get(fromId)
      const to = nodeByTask.get(toId)
      if (from && to && to.depth < from.depth + 1) { to.depth = from.depth + 1; changed = true }
    }
    if (!changed) break
  }

  const nodes = [...storyInfo.values(), ...taskNodes]
  const columns = new Map()
  for (const node of nodes) {
    const rows = columns.get(node.depth) || []
    rows.push(node)
    columns.set(node.depth, rows)
  }
  for (const [depth, rows] of columns) rows.forEach((node, row) => { node.x = 32 + depth * COL_GAP; node.y = 30 + row * ROW_GAP })
  const byId = new Map(nodes.map(node => [node.id, node]))
  const positionedEdges = edges.map(edge => ({ ...edge, source: byId.get(edge.from), target: byId.get(edge.to) })).filter(edge => edge.source && edge.target)
  const maxDepth = Math.max(0, ...columns.keys())
  const maxRows = Math.max(1, ...[...columns.values()].map(rows => rows.length))
  return { nodes, edges: positionedEdges, width: 64 + maxDepth * COL_GAP + CARD_W, height: 62 + maxRows * ROW_GAP, dependencyCount: dependencies.length, externalCount: externalDependencies.size }
}

function TaskNode({ node, onEdit }) {
  const isStory = node.type === 'story'
  const task = node.task
  const status = stateStyle(task?.status)
  const color = isStory ? '#a99aff' : status.color
  const titleLines = wrapTitle(isStory ? node.title : task.title)
  const assignee = task?.assignedTo?.name || 'Unassigned'
  const priority = String(task?.priority || 'medium').toUpperCase()
  const open = () => { if (!isStory) onEdit(task) }
  return <g className={`task-flow-node ${isStory ? 'story' : 'task'}`} transform={`translate(${node.x},${node.y})`} onClick={open} onKeyDown={event => { if (!isStory && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); open() } }} role={isStory ? undefined : 'button'} tabIndex={isStory ? undefined : 0}>
    <rect width={CARD_W} height={CARD_H} rx="12" fill={isStory ? '#211e40' : '#191b35'} stroke={isStory ? '#5c508d' : '#343653'} strokeWidth="1"/>
    <rect width="4" height={CARD_H} rx="2" fill={color}/>
    <circle cx="20" cy="19" r="4" fill={color}/>
    <text x="31" y="22" className="task-flow-eyebrow">{isStory ? (node.storyKey || 'USER STORY') : status.label}</text>
    {!isStory && <text x={CARD_W - 14} y="22" textAnchor="end" className="task-flow-priority">{priority}</text>}
    <text x="16" y="48" className="task-flow-title">{titleLines.map((line, index) => <tspan key={index} x="16" dy={index === 0 ? 0 : 16}>{line}</tspan>)}</text>
    {!isStory && <><line x1="15" y1="78" x2={CARD_W - 15} y2="78" stroke="#343653"/><text x="16" y="98" className="task-flow-meta">{assignee.length > 24 ? `${assignee.slice(0, 21)}…` : assignee}</text><text x={CARD_W - 15} y="98" textAnchor="end" className="task-flow-meta">{Number(task.storyPoints) || 0} pts</text></>}
    {isStory && <text x="16" y="94" className="task-flow-meta">{node.storyKey ? 'Story' : 'Parent story'}</text>}
  </g>
}

export default function TaskFlow({ tasks, onEdit }) {
  const graph = useMemo(() => makeGraph(tasks), [tasks])
  if (!tasks.length) return <div className="task-flow-empty"><span>01</span><strong>No tasks match this view</strong><p>Clear the filters or add sprint tasks to generate a task flow.</p></div>
  return <section className="task-flow-panel panel">
    <div className="task-flow-toolbar"><div><span className="flow-label">GENERATED FROM SAVED TASKS</span><h3>Task flow</h3><p>Stories group related work. Arrows show explicit dependencies; they are never inferred.</p></div><div className="task-flow-legend"><span><i className="flow-legend-story"/>Story</span><span><i className="flow-legend-dependency"/>Depends on</span></div></div>
    {(graph.externalCount > 0 || graph.dependencyCount === 0) && <div className="task-flow-note">{graph.externalCount > 0 ? `${graph.externalCount} prerequisite task${graph.externalCount === 1 ? '' : 's'} are outside the current filters.` : 'No task dependencies yet. Edit a task to select which tasks must finish first.'}</div>}
    <div className="task-flow-scroll"><svg className="task-flow-svg" width={graph.width} height={graph.height} viewBox={`0 0 ${graph.width} ${graph.height}`} role="img" aria-label="Task flow diagram showing user stories, tasks and saved dependencies">
      <defs><pattern id="taskFlowDots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#454363" opacity=".46"/></pattern><marker id="taskFlowArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8174c6"/></marker></defs>
      <rect width="100%" height="100%" fill="url(#taskFlowDots)"/>
      {graph.edges.map((edge, index) => { const sx=edge.source.x+CARD_W; const sy=edge.source.y+CARD_H/2; const tx=edge.target.x; const ty=edge.target.y+CARD_H/2; const bend=Math.max(36,(tx-sx)*.45);return <path key={`${edge.from}-${edge.to}-${index}`} d={`M ${sx} ${sy} C ${sx+bend} ${sy}, ${tx-bend} ${ty}, ${tx} ${ty}`} fill="none" stroke={edge.type==='story'?'#7166a9':'#8c7dde'} strokeWidth={edge.type==='story'?1.5:2} strokeDasharray={edge.type==='story'?'5 5':undefined} opacity={edge.type==='story' ? .55 : .86} markerEnd="url(#taskFlowArrow)"/> })}
      {graph.nodes.map(node => <TaskNode key={node.id} node={node} onEdit={onEdit}/>)}
    </svg></div>
    <div className="task-flow-foot"><span>{graph.nodes.filter(node => node.type === 'story').length} stories</span><i/><span>{tasks.length} tasks</span><i/><span>{graph.dependencyCount} dependencies</span></div>
  </section>
}
