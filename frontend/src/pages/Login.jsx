import { useState } from 'react'
import logo from '../assets/logo.png'

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Simple credential check — change these as needed
        setTimeout(() => {
            if (username === 'admin' && password === 'finops123') {
                onLogin()
            } else {
                setError('Invalid username or password.')
            }
            setLoading(false)
        }, 800)
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>

                {/* Logo + Company name */}
                <div style={styles.logoRow}>
                    <img src={logo} alt="Logo" style={styles.logoImg} />
                </div>

                {/* FinOps.AI pill */}
                <div style={styles.pill}>
                    <div style={styles.pillTitle}>FinOps.AI</div>
                    <div style={styles.pillSub}>Azure AI FinOps Platform</div>
                    <div style={styles.pillFeatures}>
                        <span>✓ Anomaly Detection</span>
                        <span>✓ AI Explanations</span>
                        <span>✓ Auto-Tagging</span>
                    </div>
                </div>

                {/* Sign in form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    <p style={styles.formTitle}>Sign in to your account</p>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Username</label>
                        <input
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    {error && (
                        <div style={styles.error}>{error}</div>
                    )}

                    <button
                        type="submit"
                        style={styles.signInBtn}
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                {/* Footer */}
                <p style={styles.footer}>© 2026 NexTurn. All rights reserved.</p>
            </div>
        </div>
    )
}

const styles = {
    page: {
        minHeight: '100vh',
        background: '#EBF4FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif",
    },
    card: {
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '40px 44px',
        width: '100%',
        maxWidth: 520,
        boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
    },
    logoRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    logoImg: {
        height: 56,
        objectFit: 'contain',
    },
    pill: {
        background: '#EBF4FF',
        border: '1px solid #BFDBFE',
        borderRadius: 12,
        padding: '16px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    pillTitle: {
        fontSize: 20,
        fontWeight: 800,
        color: '#1D4ED8',
        letterSpacing: '-0.3px',
    },
    pillSub: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: 500,
    },
    pillFeatures: {
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        fontSize: 12,
        color: '#2563EB',
        fontWeight: 600,
        marginTop: 4,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 700,
        color: '#111827',
        margin: 0,
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: 500,
        color: '#6B7280',
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: 10,
        border: '1px solid #E5E7EB',
        fontSize: 14,
        color: '#111827',
        background: '#F9FAFB',
        outline: 'none',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'border-color 0.15s',
    },
    error: {
        background: '#FEE2E2',
        border: '1px solid #FECACA',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        color: '#DC2626',
    },
    signInBtn: {
        width: '100%',
        padding: '14px',
        background: '#2D3FE0',
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 700,
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'background 0.15s',
        marginTop: 4,
    },
    footer: {
        textAlign: 'center',
        fontSize: 12,
        color: '#9CA3AF',
        margin: 0,
    },
}