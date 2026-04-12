import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Check, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Navbar from '../components/layout/Navbar'
import ValidationModal from '../components/ui/ValidationModal'
import styles from './AuthPage.module.css'
import { checkEmailExists, sendAuthCode, verifyAuthCode, registerUser } from '../utils/api'

const PW_RULES = [
  { label: '6자 이상',  test: pw => pw.length >= 6 },
  { label: '영문 포함', test: pw => /[a-zA-Z]/.test(pw) },
  { label: '숫자 포함', test: pw => /[0-9]/.test(pw) },
]

// ── 전화번호 자동 하이픈 포매터 ─────────────────────────────────────
function formatPhone(val) {
  const digits = val.replace(/\D/g, '').slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return digits.slice(0,3) + '-' + digits.slice(3)
  return digits.slice(0,3) + '-' + digits.slice(3,7) + '-' + digits.slice(7)
}

// ── 카운트다운 훅 ────────────────────────────────────────────────────
function useCountdown(seconds) {
  const [remaining, setRemaining] = useState(0)
  const timerRef = useRef(null)

  const start = () => {
    clearInterval(timerRef.current)
    setRemaining(seconds)
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const reset = () => { clearInterval(timerRef.current); setRemaining(0) }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  return { remaining, formatted: `${mm}:${ss}`, start, reset }
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup, isLoading, error, clearError, user } = useAuthStore()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [agree,    setAgree]    = useState(false)
  const [phone,    setPhone]    = useState('')

  // ── 이메일 중복 확인 상태 ────────────────────────────────────────
  const [dupChecked,  setDupChecked]  = useState(false)  // 중복 확인 완료
  const [dupResult,   setDupResult]   = useState(null)   // 'ok' | 'dup'
  const [dupLoading,  setDupLoading]  = useState(false)

  // ── 이메일 인증 상태 ─────────────────────────────────────────────
  const [codeGenerated, setCodeGenerated] = useState(false)  // 코드 발송됨
  const [verifyCode,    setVerifyCode]    = useState('')      // 사용자 입력
  const [secretCode,    setSecretCode]    = useState('')      // 발급된 코드
  const [verified,      setVerified]      = useState(false)   // 인증 완료
  const [codeError,     setCodeError]     = useState('')
  const countdown = useCountdown(180) // 3분

  // ── 모달 ─────────────────────────────────────────────────────────
  const [modalOpen,    setModalOpen]    = useState(false)
  const [modalErrs,    setModalErrs]    = useState([])
  const [successModal, setSuccessModal] = useState(false)

  useEffect(() => { if (user) navigate('/', { replace: true }) }, [user])
  useEffect(() => { clearError() }, [])
  useEffect(() => {
    if (error) { setModalErrs([error]); setModalOpen(true) }
  }, [error])

  // 이메일 바뀌면 중복 확인·인증 초기화
  const handleEmailChange = (v) => {
    setEmail(v)
    setDupChecked(false); setDupResult(null)
    setCodeGenerated(false); setVerified(false)
    setVerifyCode(''); setCodeError('')
    countdown.reset()
  }

  // ── 중복 확인 ────────────────────────────────────────────────────
  const handleDupCheck = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setModalErrs(['올바른 이메일 형식을 입력해주세요.'])
      setModalOpen(true)
      return
    }
    setDupLoading(true)
    try {
      const data = await checkEmailExists(email)
      setDupResult(data.existYn === 'Y' ? 'dup' : 'ok')
      setDupChecked(true)
    } catch (e) {
      setModalErrs(['서버 오류가 발생했습니다.'])
      setModalOpen(true)
    } finally {
      setDupLoading(false)  // 성공/실패 상관없이 로딩 해제
    }
  }

  // ── 인증코드 발송 ────────────────────────────────────────────────
  const handleSendCode = async () => {
    try {
      const data = await sendAuthCode(email)
      if (data.result === 1) {
        setCodeGenerated(true)
        setVerified(false)
        setVerifyCode('')
        setCodeError('')
        countdown.start()
      } else {
        setCodeError(data.msg)
      }
    } catch (e) {
      setCodeError('서버 오류가 발생했습니다.')
    }
  }

  // ── 코드 확인 ────────────────────────────────────────────────────
  const handleVerifyCode = async () => {
    if (countdown.remaining === 0) {
      setCodeError('인증 시간이 만료되었습니다. 코드를 다시 발송해주세요.')
      return
    }
    try {
      const data = await verifyAuthCode(email, verifyCode)
      if (data.result === 1) {
        setVerified(true)
        setCodeError('')
        countdown.reset()
      } else {
        setCodeError(data.msg)
      }
    } catch (e) {
      setCodeError('서버 오류가 발생했습니다.')
    }
  }

  // ── 폼 검증 ──────────────────────────────────────────────────────
  const validateForm = () => {
    const errs = []
    if (!name.trim())          errs.push('이름을 입력해주세요.')
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 10)   errs.push('올바른 전화번호를 입력해주세요.')
    if (dupResult !== 'ok')    errs.push('이메일 중복 확인을 완료해주세요.')
    if (!verified)             errs.push('이메일 인증을 완료해주세요.')
    if (password.length < 6)   errs.push('비밀번호는 6자 이상이어야 합니다.')
    if (password !== confirm)   errs.push('비밀번호가 일치하지 않습니다.')
    if (!agree)                errs.push('이용약관에 동의해주세요.')
    return errs
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateForm()
    if (errs.length) { setModalErrs(errs); setModalOpen(true); return }

    try {
      const data = await registerUser(name, email, phone, password)
      if (data.result === 1) {
        setSuccessModal(true)
      } else {
        setModalErrs([data.msg])
        setModalOpen(true)
      }
    } catch (e) {
      setModalErrs(['서버 오류가 발생했습니다.'])
      setModalOpen(true)
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

          <h1 className={styles.title}>회원가입</h1>
          <p className={styles.sub}>무료로 시작하고 AI 냉장고 분석을 경험해보세요</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>

            {/* ── 이름 ── */}
            <div className={styles.fieldWrap}>
              <label className={styles.label}>이름</label>
              <div className={styles.inputWrap}>
                <User size={16} className={styles.inputIcon} />
                <input type="text" className={styles.input} placeholder="홍길동"
                  value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
            </div>


            {/* ── 전화번호 ── */}
            <div className={styles.fieldWrap}>
              <label className={styles.label}>전화번호</label>
              <div className={styles.inputWrap}>
                <Phone size={16} className={styles.inputIcon} />
                <input
                  type="tel"
                  className={styles.input}
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  autoComplete="tel"
                  maxLength={13}
                />
                {phone.replace(/\D/g,'').length >= 10 && (
                  <Check size={15} style={{ color: '#2ECC71', flexShrink: 0 }} />
                )}
              </div>
            </div>

            {/* ── 이메일 + 중복 확인 ── */}
            <div className={styles.fieldWrap}>
              <label className={styles.label}>이메일</label>
              <div className={styles.inputRowWrap}>
                <div className={`${styles.inputWrap} ${styles.inputFlex}
                  ${dupResult === 'ok' ? styles.inputOk : ''}
                  ${dupResult === 'dup' ? styles.inputErr : ''}
                `}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="example@email.com"
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    disabled={verified}
                    autoComplete="email"
                  />
                  {dupResult === 'ok' && !verified && <Check size={15} style={{ color: '#2ECC71', flexShrink: 0 }} />}
                  {verified && <Check size={15} style={{ color: '#2ECC71', flexShrink: 0 }} />}
                </div>
                <button
                  type="button"
                  className={`${styles.inlineBtn} ${dupResult === 'ok' ? styles.inlineBtnDone : ''}`}
                  onClick={handleDupCheck}
                  disabled={dupLoading || verified || !email}
                >
                  {dupLoading
                    ? <span className={styles.spinnerSm} />
                    : dupResult === 'ok' ? '확인 완료' : '중복 확인'}
                </button>
              </div>

              {/* 중복 확인 결과 */}
              {dupResult === 'ok'  && <p className={styles.fieldHintOk}>✓ 사용 가능한 이메일입니다.</p>}
              {dupResult === 'dup' && <p className={styles.fieldHintErr}>이미 사용 중인 이메일입니다.</p>}
            </div>

            {/* ── 이메일 인증 (중복 확인 통과 후 노출) ── */}
            {dupResult === 'ok' && !verified && (
              <div className={styles.fieldWrap}>
                <label className={styles.label}>
                  이메일 인증
                  {codeGenerated && countdown.remaining > 0 && (
                    <span className={styles.countdown}>{countdown.formatted}</span>
                  )}
                  {codeGenerated && countdown.remaining === 0 && (
                    <span className={styles.countdownExpired}>만료됨</span>
                  )}
                </label>

                {!codeGenerated ? (
                  <button type="button" className={styles.sendCodeBtn} onClick={handleSendCode}>
                    <Mail size={15} />
                    인증코드 발송
                  </button>
                ) : (
                  <>
                    <div className={styles.inputRowWrap}>
                      <div className={styles.inputWrap} style={{ flex: 1 }}>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="6자리 인증코드 입력"
                          value={verifyCode}
                          onChange={e => { setVerifyCode(e.target.value); setCodeError('') }}
                          maxLength={6}
                          style={{ letterSpacing: '0.15em', fontFamily: 'Space Mono, monospace' }}
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.inlineBtn}
                        onClick={handleVerifyCode}
                        disabled={verifyCode.length !== 6}
                      >
                        확인
                      </button>
                      <button
                        type="button"
                        className={styles.inlineBtnGhost}
                        onClick={handleSendCode}
                        title="재발송"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                    {codeError && <p className={styles.fieldHintErr}>{codeError}</p>}
                    <p className={styles.fieldHintMuted}>
                      {email} 로 발송된 6자리 코드를 입력해주세요.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* 인증 완료 배지 */}
            {verified && (
              <div className={styles.verifiedBadge}>
                <Check size={14} />
                이메일 인증이 완료되었습니다
              </div>
            )}

            {/* ── 비밀번호 ── */}
            <div className={styles.fieldWrap}>
              <label className={styles.label}>비밀번호</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input type={showPw ? 'text' : 'password'} className={styles.input} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className={styles.pwRules}>
                  {PW_RULES.map(rule => (
                    <span key={rule.label} className={`${styles.pwRule} ${rule.test(password) ? styles.pwRuleOk : ''}`}>
                      ✓ {rule.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── 비밀번호 확인 ── */}
            <div className={styles.fieldWrap}>
              <label className={styles.label}>비밀번호 확인</label>
              <div className={`${styles.inputWrap} ${confirm && password === confirm ? styles.inputOk : ''}`}>
                <Lock size={16} className={styles.inputIcon} />
                <input type={showPw ? 'text' : 'password'} className={styles.input} placeholder="••••••••"
                  value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
                {confirm && password === confirm && <Check size={15} style={{ color: '#2ECC71', flexShrink: 0 }} />}
              </div>
            </div>

            {/* ── 약관 ── */}
            <label className={styles.agreeRow}>
              <div
                className={`${styles.checkbox} ${agree ? styles.checkboxChecked : ''}`}
                onClick={() => setAgree(v => !v)}
              >
                {agree && <Check size={12} />}
              </div>
              <span className={styles.agreeText}>
                <a href="#" className={styles.agreeLink}>이용약관</a> 및{' '}
                <a href="#" className={styles.agreeLink}>개인정보처리방침</a>에 동의합니다
              </span>
            </label>

            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading
                ? <span className={styles.spinner} />
                : <><span>가입 완료</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <div className={styles.bottomLinks}>
            <p className={styles.switchText}>
              이미 계정이 있으신가요?<Link to="/login" className={styles.switchLink}>로그인</Link>
            </p>
            <div className={styles.bottomLinkRow}>
              <Link to="/find-id" className={styles.linkBtn}>아이디 찾기</Link>
              <span className={styles.linkDivider} />
              <Link to="/find-pw" className={styles.linkBtn}>비밀번호 찾기</Link>
            </div>
          </div>
        </div>
      </div>

      <ValidationModal
        open={modalOpen}
        errors={modalErrs}
        onClose={() => { setModalOpen(false); clearError() }}
      />

      {/* ── 가입 성공 모달 ── */}
      {successModal && (
        <div
          className={styles.successOverlay}
          onClick={e => e.target === e.currentTarget && navigate('/login')}
        >
          <div className={styles.successCard}>
            <div className={styles.successIconWrap}>
              <div className={styles.successIconRing} />
              <Check size={28} className={styles.successIcon} />
            </div>
            <h2 className={styles.successTitle}>가입 완료!</h2>
            <p className={styles.successDesc}>
              <strong style={{ color: '#E6EDF3' }}>{name}</strong>님, 환영합니다 🎉<br />
              <span style={{ color: '#8B949E', fontSize: 13 }}>{email}</span>으로<br />
              회원가입이 완료되었습니다.
            </p>
            <button
              className={styles.successBtn}
              onClick={() => navigate('/login')}
            >
              로그인하러 가기 <ArrowRight size={15} />
            </button>
            <p className={styles.successHint}>AI 냉장고 분석을 바로 시작해보세요!</p>
          </div>
        </div>
      )}
    </div>
  )
}
