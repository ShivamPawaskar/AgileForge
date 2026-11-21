import { test } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server.js'
import { Route, Routes } from 'react-router-dom'
import { createServer } from 'vite'

test('React app renders its initial route instead of crashing during provider setup', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { default: App } = await vite.ssrLoadModule('/src/App.jsx')
    const html = renderToString(React.createElement(StaticRouter, { location: '/' }, React.createElement(App)))
    assert.match(html, /class="auth-loading"|class="auth-page"|class="app-shell"/)
    assert.doesNotMatch(html, /Error:|ReferenceError:/)
  } finally {
    await vite.close()
  }
})

test('authenticated dashboard layout and overview render with project data', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const [{ AppContext }, { default: AppLayout }, { default: Overview }] = await Promise.all([
      vite.ssrLoadModule('/src/context/AppContext.jsx'),
      vite.ssrLoadModule('/src/layouts/AppLayout.jsx'),
      vite.ssrLoadModule('/src/pages/Overview.jsx'),
    ])
    const project={_id:'project-1',name:'Demo project',members:[]}
    const value={user:{id:'user-1',name:'Demo User',email:'demo@example.com'},authLoading:false,projects:[project],projectsLoading:false,projectError:'',projectId:'project-1',selectedProject:project,selectedSprint:null,sprints:[],sprintId:'',team:'All team',tasks:[],setProject:()=>{},setSprint:()=>{},setTeam:()=>{},notify:()=>{},logout:async()=>{},refreshProjects:async()=>{}}
    const tree=React.createElement(StaticRouter,{location:'/'},React.createElement(AppContext.Provider,{value},React.createElement(Routes,null,React.createElement(Route,{path:'/',element:React.createElement(AppLayout)},React.createElement(Route,{index:true,element:React.createElement(Overview)})))))
    const html=renderToString(tree)
    assert.match(html,/Demo project/)
    assert.match(html,/Sprint health/)
  } finally { await vite.close() }
})

test('new story modal renders with no existing story or acceptance criteria', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { StoryModal } = await vite.ssrLoadModule('/src/pages/ProductBacklog.jsx')
    const html=renderToString(React.createElement(StoryModal,{story:null,members:[],onClose:()=>{},onSave:async()=>{}}))
    assert.match(html,/Create user story/)
    assert.match(html,/Acceptance criteria/)
  } finally { await vite.close() }
})

test('metric card has a safe default icon when a caller omits one', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { default: MetricCard } = await vite.ssrLoadModule('/src/components/MetricCard.jsx')
    const html=renderToString(React.createElement(MetricCard,{title:'Pending',value:0}))
    assert.match(html,/metric-card/)
  } finally { await vite.close() }
})

test('Kanban renders persisted API tasks in the matching status columns', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const [{ AppContext }, { Board, kanbanStatusId }] = await Promise.all([
      vite.ssrLoadModule('/src/context/AppContext.jsx'),
      vite.ssrLoadModule('/src/pages/SprintExecutionPages.jsx'),
    ])
    assert.equal(kanbanStatusId('To do'),'todo')
    assert.equal(kanbanStatusId('In progress'),'in_progress')
    assert.equal(kanbanStatusId('In review'),'in_review')
    assert.equal(kanbanStatusId('Done'),'done')
    const project={_id:'p1',name:'Board project',members:[]}
    const sprint={_id:'s1',name:'Sprint 1'}
    const value={selectedProject:project,selectedSprint:sprint,tasks:[
      {_id:'t1',id:'t1',title:'Persisted todo',status:'To do',priority:'High',sprintId:'s1',storyPoints:2},
      {_id:'t2',id:'t2',title:'Persisted in progress',status:'In progress',priority:'Medium',sprintId:'s1',storyPoints:3},
    ],refreshTasks:async()=>{},notify:()=>{}}
    const html=renderToString(React.createElement(AppContext.Provider,{value},React.createElement(Board)))
    assert.match(html,/Persisted todo/)
    assert.match(html,/Persisted in progress/)
  } finally { await vite.close() }
})

test('sprint cards sort chronologically and break ties consistently', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { orderSprints }=await vite.ssrLoadModule('/src/pages/SprintPlanning.jsx')
    const ordered=orderSprints([{_id:'later',name:'Later',startDate:'2026-11-10',createdAt:'2026-11-01'},{_id:'first',name:'First',startDate:'2026-11-01',createdAt:'2026-11-02'},{_id:'second',name:'Second',startDate:'2026-11-01',createdAt:'2026-11-03'}])
    assert.deepEqual(ordered.map(sprint=>sprint._id),['first','second','later'])
  } finally { await vite.close() }
})
