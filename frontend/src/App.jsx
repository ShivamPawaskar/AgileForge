import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Overview from './pages/Overview'
import Settings from './pages/Settings'
import { Analytics, Board, Readiness } from './pages/SprintExecutionPages'
import ProjectManagement from './pages/ProjectManagement'
import TeamManagement from './pages/TeamManagement'
import SprintPlanning from './pages/SprintPlanning'
import ProductBacklog from './pages/ProductBacklog'
import { AppProvider } from './context/AppContext'
import { useApp } from './context/AppContext'
import AuthPage from './pages/AuthPage'
function NotFound(){return <div className="empty-page"><h1>Page not found</h1><p>The page you’re looking for doesn’t exist.</p><a href="/">Return to overview</a></div>}
function AuthGate({children}){const {user,authLoading}=useApp();const location=useLocation();if(authLoading)return <div className="auth-loading">Loading AgileForge…</div>;if(!user)return <Navigate to="/login" replace state={{from:location.pathname}}/>;if(user.mustChangePassword&&location.pathname!=='/settings')return <Navigate to="/settings" replace/>;return children}
export default function App(){return <AppProvider><Routes><Route path="/login" element={<AuthPage/>}/><Route path="/register" element={<AuthPage register/>}/><Route element={<AuthGate><AppLayout/></AuthGate>}><Route index element={<Overview/>}/><Route path="projects" element={<ProjectManagement/>}/><Route path="backlog" element={<ProductBacklog/>}/><Route path="planning" element={<SprintPlanning/>}/><Route path="board" element={<Board/>}/><Route path="analytics" element={<Analytics/>}/><Route path="readiness" element={<Readiness/>}/><Route path="team" element={<TeamManagement/>}/><Route path="settings" element={<Settings/>}/></Route><Route path="*" element={<NotFound/>}/></Routes></AppProvider>}
