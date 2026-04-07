import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Phone, AlertCircle, ArrowRight, ChevronLeft, CheckCircle } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import ValidationModal from '../components/ui/ValidationModal'
import styles from './AuthPage.module.css'
import { searchUserEmail } from '../utils/api'  // 경로 확인

export default function FindIdPage() {
  const navigate = useNavigate()
  const [name,      setName]      = useState('')
  const [phone,     setPhone]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalErrs, setModalErrs] = useState([])

  const validate = (n = name, p = phone) => {
    const e = {}
    if (!n.trim()) e.name = '이름을 입력해주세요.'
    if (p.replace(/-/g, '').length < 10) e.phone = '올바른 전화번호를 입력해주세요.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setModalErrs(Object.values(errs))
      setModalOpen(true)
      return
    }
    setLoading(true); setError('')
    try {
      const data = await searchUserEmail(name, phone)

      if (data?.email) {
        // 이메일 마스킹: abc***@gmail.com 형태로 표시
        const [id, domain] = data.email.split('@')
        const masked = id.slice(0, 3) + '***@' + domain
        setResult({ found: true, email: masked })
      } else {
        setResult({ found: false })
        setError('입력하신 정보와 일치하는 계정을 찾을 수 없습니다.')
      }
    } catch {
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null); setError('')
    setName(''); setPhone('')
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.body}>
        <div className={styles.card}>
          <div className={styles.logoWrap}>
            <span className={styles.logoEmoji}>📸</span>
            <span className={styles.logoText}>찍고먹어요</span>
          </div>
          <h1 className={styles.title}>아이디 찾기</h1>
          <p className={styles.sub}>가입 시 등록한 이름과 휴대폰 번호로 이메일을 확인해요</p>

          {result?.found ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className={styles.successBanner}>
                <CheckCircle size={18} style={{ flexShrink: 0 }} />
                가입된 이메일 주소를 찾았습니다.
              </div>
              <div className={styles.resultBox}>
                <div className={styles.resultEmail}>{result.email}</div>
                <div className={styles.resultHint}>보안을 위해 일부 정보는 가려져 있습니다.</div>
              </div>
              <button className={styles.submitBtn} onClick={() => navigate('/login')}>
                로그인하러 가기 <ArrowRight size={16} />
              </button>
              <button className={styles.ghostBtn} onClick={reset}>다시 찾기</button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              {/* 이름 */}
              <div className={styles.fieldWrap}>
                <label className={styles.label}>이름</label>
                <div className={styles.inputWrap}>
                  <User size={16} className={styles.inputIcon} />
                  <input
                    type="text" className={styles.input} placeholder="홍길동"
                    value={name} onChange={e => setName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {/* 휴대폰 번호 */}
              <div className={styles.fieldWrap}>
                <label className={styles.label}>휴대폰 번호</label>
                <div className={styles.inputWrap}>
                  <Phone size={16} className={styles.inputIcon} />
                  <input
                    type="tel" className={styles.input} placeholder="010-1234-5678"
                    value={phone}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 11)
                      setPhone(v.replace(/(\d{3})(\d{4})(\d{0,4})/, (_, a, b, c) =>
                        c ? `${a}-${b}-${c}` : b ? `${a}-${b}` : a
                      ))
                    }}
                  />
                </div>
              </div>

              {error && <div className={styles.serverErr}><AlertCircle size={14} />{error}</div>}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading
                  ? <span className={styles.spinner} />
                  : <><span>아이디 찾기</span><ArrowRight size={16} /></>
                }
              </button>
            </form>
          )}

          <div className={styles.bottomLinks}>
            <div className={styles.bottomLinkRow}>
              <Link to="/login" className={styles.linkBtn}>
                <ChevronLeft size={12} style={{ verticalAlign: 'middle' }} />로그인
              </Link>
              <span className={styles.linkDivider} />
              <Link to="/find-pw" className={styles.linkBtn}>비밀번호 찾기</Link>
              <span className={styles.linkDivider} />
              <Link to="/signup" className={styles.linkBtn}>회원가입</Link>
            </div>
          </div>
        </div>
      </div>

      <ValidationModal
        open={modalOpen}
        errors={modalErrs}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
