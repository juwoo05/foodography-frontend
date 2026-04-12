import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Navbar from '../components/layout/Navbar'
import ValidationModal from '../components/ui/ValidationModal'
import styles from './AuthPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError, user } = useAuthStore()

  const [email,     setEmail]     = useState()
  const [password,  setPassword]  = useState()
  const [showPw,    setShowPw]    = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalErrs, setModalErrs] = useState([])

  useEffect(() => { if (user) navigate('/', { replace: true }) }, [user])
  useEffect(() => { clearError() }, [])

  // authStore 에러 → 모달로 표시
  useEffect(() => {
    if (error) {
      setModalErrs([error])
      setModalOpen(true)
    }
  }, [error])

  const validateForm = () => {
    const errs = []
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) errs.push('올바른 이메일 형식을 입력해주세요.')
    if (password.length < 6)     errs.push('비밀번호는 6자 이상이어야 합니다.')
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateForm()
    if (errs.length) {
      setModalErrs(errs)
      setModalOpen(true)
      return
    }
    const result = await login(email, password)
    if (result.success) {
      navigate('/')
    }
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.body}>
        <div className={styles.card}>
          {/* 로고 */}
          <div className={styles.logoWrap}>
            <span className={styles.logoEmoji}>📸</span>
            <span className={styles.logoText}>찍고먹어요</span>
          </div>

          <h1 className={styles.title}>로그인</h1>
          <p className={styles.sub}>이메일과 비밀번호로 로그인해요</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {/* 이메일 */}
            <div className={styles.fieldWrap}>
              <label className={styles.label}>이메일</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="email" className={styles.input} placeholder="example@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email" autoFocus
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div className={styles.fieldWrap}>
              <div className={styles.labelRow}>
                <label className={styles.label}>비밀번호</label>
                <div className={styles.linkGroup}>
                  <Link to="/find-id" className={styles.linkBtn}>아이디 찾기</Link>
                  <span className={styles.linkDivider} />
                  <Link to="/find-pw" className={styles.linkBtn}>비밀번호 찾기</Link>
                </div>
              </div>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  type={showPw ? 'text' : 'password'} className={styles.input} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading
                ? <span className={styles.spinner} />
                : <><span>로그인</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <div className={styles.bottomLinks}>
            <p className={styles.switchText}>
              계정이 없으신가요?<Link to="/signup" className={styles.switchLink}>회원가입</Link>
            </p>
          </div>
        </div>
      </div>

      <ValidationModal
        open={modalOpen}
        errors={modalErrs}
        onClose={() => { setModalOpen(false); clearError() }}
      />
    </div>
  )
}
