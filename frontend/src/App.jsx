import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, SearchCode, Tag, Settings, Sun, Moon, Layers } from 'lucide-react'
import { useState, useEffect } from 'react'
import Home from './pages/Home.jsx'
import AnomalyDetection from './pages/AnomalyDetection.jsx'
import AutoTagging from './pages/AutoTagging.jsx'
import Login from './pages/Login.jsx'

// ── Theme definitions ─────────────────────────────────────────────────────────
const THEMES = {
    navy: {
        label: 'Navy',
        icon: <Layers size={14} />,
        vars: {
            '--navy': '#0B1628',
            '--navy-mid': '#112240',
            '--navy-light': '#1A3A5C',
            '--blue': '#2E75B6',
            '--blue-light': '#4A9FD4',
            '--blue-xlight': '#A8D4F0',
            '--white': '#FFFFFF',
            '--text': '#E2E8F0',
            '--text-muted': '#94A3B8',
            '--border': 'rgba(255,255,255,0.08)',
            '--card-bg': 'rgba(17,34,64,0.8)',
            '--gray-light': 'rgba(255,255,255,0.04)',
        },
        body: { background: '#0B1628', color: '#E2E8F0' },
    },
    dark: {
        label: 'Dark',
        icon: <Moon size={14} />,
        vars: {
            '--navy': '#0a0a0a',
            '--navy-mid': '#141414',
            '--navy-light': '#202020',
            '--blue': '#4f8ef7',
            '--blue-light': '#93c5fd',
            '--blue-xlight': '#bfdbfe',
            '--white': '#f1f5f9',
            '--text': '#e2e8f0',
            '--text-muted': '#94a3b8',
            '--border': 'rgba(255,255,255,0.1)',
            '--card-bg': 'rgba(20,20,20,0.9)',
            '--gray-light': 'rgba(255,255,255,0.04)',
        },
        body: { background: '#0a0a0a', color: '#e2e8f0' },
    },
    light: {
        label: 'Light',
        icon: <Sun size={14} />,
        vars: {
            '--navy': '#f0f4f8',
            '--navy-mid': '#ffffff',
            '--navy-light': '#e2e8f0',
            '--blue': '#2563eb',
            '--blue-light': '#1d4ed8',
            '--blue-xlight': '#1e40af',
            '--white': '#111827',
            '--text': '#1a202c',
            '--text-muted': '#4b5563',
            '--border': 'rgba(0,0,0,0.1)',
            '--card-bg': 'rgba(255,255,255,0.95)',
            '--gray-light': 'rgba(0,0,0,0.03)',
        },
        body: { background: '#f0f4f8', color: '#1a202c' },
    },
}

function applyTheme(themeKey) {
    const theme = THEMES[themeKey]
    const root = document.documentElement
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))
    Object.entries(theme.body).forEach(([k, v]) => {
        document.body.style[k] = v
    })
    document.body.setAttribute('data-theme', themeKey)
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ theme, setTheme }) {
    const [settingsOpen, setSettingsOpen] = useState(false)

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">📊</div>
                <div className="logo-title">FinOps AI</div>
                <div className="logo-sub">Azure Spend Intelligence</div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-label">Navigation</div>

                <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                    <LayoutDashboard size={15} />
                    Home Dashboard
                </NavLink>

                <NavLink to="/anomalies" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                    <SearchCode size={15} />
                    Anomaly Detection
                </NavLink>

                <NavLink to="/tagging" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                    <Tag size={15} />
                    Auto-Tagging
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <button
                    className="settings-btn"
                    onClick={() => setSettingsOpen(s => !s)}
                >
                    <Settings size={14} />
                    Settings
                    <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>
                        {settingsOpen ? '▲' : '▼'}
                    </span>
                </button>

                {settingsOpen && (
                    <div className="settings-panel">
                        <div className="settings-label">Theme</div>
                        <div className="theme-options">
                            {Object.entries(THEMES).map(([key, val]) => (
                                <button
                                    key={key}
                                    className={`theme-btn${theme === key ? ' active' : ''}`}
                                    onClick={() => {
                                        setTheme(key)
                                        applyTheme(key)
                                        localStorage.setItem('finops-theme', key)
                                    }}
                                >
                                    {val.icon}
                                    {val.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    )
}

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar() {
    const loc = useLocation()
    const map = {
        '/': 'Home Dashboard',
        '/anomalies': 'Anomaly Detection',
        '/tagging': 'Context-Based Auto-Tagging',
    }
    return (
        <div className="topbar">
            <div className="topbar-dot" />
            <span className="topbar-text">
                Azure FinOps AI &nbsp;·&nbsp; {map[loc.pathname] ?? 'Azure FinOps AI'} &nbsp;·&nbsp; Jan 2026 &nbsp;·&nbsp; 17 VMs
            </span>
        </div>
    )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(
        () => sessionStorage.getItem('finops-auth') === 'true'
    )
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('finops-theme') || 'navy'
    })

    useEffect(() => {
        applyTheme(theme)
    }, [])

    if (!isLoggedIn) return (
        <Login onLogin={() => {
            sessionStorage.setItem('finops-auth', 'true')
            setIsLoggedIn(true)
        }} />
    )

    return (
        <BrowserRouter>
            <div className="layout">
                <Sidebar theme={theme} setTheme={setTheme} />
                <div className="main">
                    <Topbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/anomalies" element={<AnomalyDetection />} />
                        <Route path="/tagging" element={<AutoTagging />} />
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    )
}