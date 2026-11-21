import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Bot, ChevronLeft, ChevronRight, Compass, Send, Sparkles, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const tour = [
  { path: '/', title: 'Your command center', text: 'Overview brings your sprint progress, workload, and health together. Use the project and sprint selectors above to change the data you are viewing.' },
  { path: '/projects', title: 'Set up a project', text: 'Create a project, describe the problem you are solving, and manage its members and delivery dates.' },
  { path: '/backlog', title: 'Shape the backlog', text: 'Write user stories, set priority and points, add acceptance criteria, and assign an owner.' },
  { path: '/planning', title: 'Plan a sprint', text: 'Set a sprint goal and dates, select backlog stories, and check each member’s capacity before assigning work.' },
  { path: '/board', title: 'Move work forward', text: 'Create tasks and move them across To Do, In Progress, Review, and Done. Status changes update sprint metrics.' },
  { path: '/analytics', title: 'Read sprint signals', text: 'Review task counts, workload, burndown, and the rule-based sprint health calculation.' },
  { path: '/readiness', title: 'Check MVP evidence', text: 'Evaluate the project against its completion checks. Failed checks include actions to reach the task or test evidence they need.' },
  { path: '/team', title: 'Coordinate the team', text: 'Review project members and their capacities. You are ready to plan, build, and show your MVP.' },
]

const answers = [
  { terms: ['create project', 'new project', 'project setup'], path: '/projects', label: 'Open projects', text: 'Go to My Projects and choose Create project. Add a name, problem statement, and dates; you can manage the team from the same area.' },
  { terms: ['capacity', 'overload', 'workload', 'points'], path: '/planning', label: 'Open sprint planning', text: 'Sprint Planning shows assigned points against each member’s capacity. If an assignment exceeds capacity, redistribute work or adjust the member capacity.' },
  { terms: ['member', 'invite', 'team', 'teammate'], path: '/projects', label: 'Manage project members', text: 'Open My Projects, choose a project, then use Add member → Add manually to enter someone yourself. To add a registered user, add them by email. Team Management shows current members and capacities.' },
  { terms: ['story', 'backlog', 'acceptance'], path: '/backlog', label: 'Open product backlog', text: 'Create a user story in Product Backlog. Add acceptance criteria, priority, story points, and an assignee before moving it into a sprint.' },
  { terms: ['sprint', 'plan', 'goal', 'date'], path: '/planning', label: 'Open sprint planning', text: 'Create a sprint with a name, goal, and date range. Then select backlog stories and distribute the work across the team.' },
  { terms: ['kanban', 'board', 'move task', 'task status', 'drag', 'create task', 'new task'], path: '/board', label: 'Open Kanban board', text: 'Create or edit tasks on the Kanban board, then drag a card to another status column. The change is saved and appears in sprint analytics.' },
  { terms: ['task flow', 'flowchart', 'dependency', 'dependencies', 'depends on', 'prerequisite'], path: '/board', label: 'Open task flow', text: 'On the Kanban board, switch to Task flow. Edit a task to link its user story and select prerequisite tasks. The diagram updates from saved relationships and will not guess the order.' },
  { terms: ['analytics', 'burndown', 'health', 'progress'], path: '/analytics', label: 'Open sprint analytics', text: 'Sprint Analytics summarizes saved task and status history. Health is rule-based and compares elapsed sprint time, completed points, remaining work, and overdue tasks.' },
  { terms: ['readiness', 'test case', 'test evidence', 'mvp'], path: '/readiness', label: 'Open MVP readiness', text: 'Evaluate MVP Readiness to see which evidence checks pass. Click a failed check to jump to its matching task or test case form.' },
]

function Mascot({ compact = false }) {
  return <span className={`guide-mascot ${compact ? 'compact' : ''}`} aria-hidden="true"><span className="mascot-antenna"/><span className="mascot-ear left"/><span className="mascot-ear right"/><span className="mascot-face"><i/><i/><b/></span><Sparkles className="mascot-spark" size={12}/></span>
}

export default function GuideAssistant() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [tourStep, setTourStep] = useState(null)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hi! I’m Forge, your AgileForge guide. I can show you around or help you find a feature.' }])
  const threadRef = useRef(null)

  useEffect(() => {
    const showGuide = () => { setOpen(true); setTourStep(0); navigate('/') }
    window.addEventListener('agileforge:open-guide', showGuide)
    return () => window.removeEventListener('agileforge:open-guide', showGuide)
  }, [navigate])

  useEffect(() => { if (open && threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight }, [messages, open, tourStep])

  const goToTourStep = index => {
    if (index < 0 || index >= tour.length) return
    setTourStep(index)
    navigate(tour[index].path)
  }

  const ask = event => {
    event.preventDefault()
    const text = question.trim()
    if (!text) return
    const normalized = text.toLowerCase()
    const match = answers.find(item => item.terms.some(term => normalized.includes(term)))
    const reply = match || { text: 'I can help with projects, team members, backlog stories, sprint planning and capacity, Kanban tasks, analytics, or MVP readiness. Try asking “How do I check capacity?”' }
    setMessages(current => [...current, { role: 'user', text }, { role: 'assistant', text: reply.text, path: reply.path, label: reply.label }])
    setQuestion('')
    setTourStep(null)
  }

  const startTour = () => { setOpen(true); goToTourStep(0) }
  const step = tourStep === null ? null : tour[tourStep]

  return <>
    {open && <section className="guide-panel" aria-label="AgileForge guide">
      <header className="guide-header"><Mascot compact/><div><strong>Forge <span>AgileForge guide</span></strong><small><i/> Here to help you ship</small></div><button type="button" className="guide-close" aria-label="Close assistant" onClick={() => setOpen(false)}><X size={16}/></button></header>
      <div className="guide-modebar"><span>{step ? <><Compass size={13}/> Product tour</> : <><Bot size={13}/> Ask for help</>}</span>{step ? <div><span>{tourStep + 1} / {tour.length}</span><button type="button" onClick={() => setTourStep(null)}>Ask Forge</button></div> : <button type="button" onClick={startTour}>Start a tour <ArrowRight size={12}/></button>}</div>
      {step ? <div className="guide-tour" ref={threadRef}>
        <div className="guide-tour-progress">{tour.map((item, index) => <i key={item.path} className={index <= tourStep ? 'active' : ''}/>)}</div>
        <span className="guide-tour-label">STEP {String(tourStep + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.text}</p>
        <div className="guide-tour-actions"><button type="button" className="guide-back" disabled={tourStep === 0} onClick={() => goToTourStep(tourStep - 1)}><ChevronLeft size={15}/> Back</button>{tourStep === tour.length - 1 ? <button type="button" className="guide-next" onClick={() => setTourStep(null)}>Finish tour <Sparkles size={14}/></button> : <button type="button" className="guide-next" onClick={() => goToTourStep(tourStep + 1)}>Next <ChevronRight size={15}/></button>}</div>
      </div> : <>
        <div className="guide-thread" ref={threadRef} aria-live="polite">{messages.map((message, index) => <div key={index} className={`guide-message ${message.role}`}><span className="guide-message-avatar">{message.role === 'assistant' ? <Mascot compact/> : 'You'}</span><div><p>{message.text}</p>{message.path && <button type="button" className="guide-result-link" onClick={() => navigate(message.path)}>{message.label}<ArrowRight size={13}/></button>}</div></div>)}</div>
        <div className="guide-suggestions"><button type="button" onClick={() => setQuestion('How do I add a team member?')}>Add a member</button><button type="button" onClick={() => setQuestion('How do I check capacity?')}>Check capacity</button><button type="button" onClick={() => setQuestion('How does MVP readiness work?')}>MVP readiness</button></div>
        <form className="guide-composer" onSubmit={ask}><input aria-label="Ask Forge a question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask how to plan, assign, or ship…"/><button type="submit" aria-label="Send question" disabled={!question.trim()}><Send size={15}/></button></form>
      </>}
    </section>}
    <button type="button" className={`guide-launcher ${open ? 'is-open' : ''}`} onClick={() => setOpen(value => !value)} aria-label={open ? 'Close Forge assistant' : 'Ask Forge for help'}><Mascot/><span>{open ? <X size={17}/> : 'Ask Forge'}</span></button>
  </>
}
