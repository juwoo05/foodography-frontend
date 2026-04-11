import React, {useState, useEffect, useRef} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ChevronLeft, CheckCircle, RefreshCw} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import ValidationModal from '../components/ui/ValidationModal'
import styles from './AuthPage.module.css'
import {sendAuthCode, verifyAuthCode, updatePassword} from '../utils/api'


const STEPS = ['이메일 확인', '인증코드', '새 비밀번호']
const CODE_EXPIRE = 180
const PW_RULES = [
    {label: '6자 이상', test: pw => pw.length >= 6},
    {label: '영문 포함', test: pw => /[a-zA-Z]/.test(pw)},
    {label: '숫자 포함', test: pw => /[0-9]/.test(pw)},
]

export default function FindPwPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [email, setEmail] = useState('')
    const [maskedEmail, setMasked] = useState('')
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [timeLeft, setTimeLeft] = useState(0)
    const [resending, setResending] = useState(false)
    const [done, setDone] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [modalErrs, setModalErrs] = useState([])
    const codeRefs = useRef([])
    const timerRef = useRef(null)

    useEffect(() => {
        if (timeLeft <= 0) {
            clearInterval(timerRef.current);
            return
        }
        timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000)
        return () => clearInterval(timerRef.current)
    }, [timeLeft])

    const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
    const ss = String(timeLeft % 60).padStart(2, '0')

    const handleSend = async (e) => {
        e.preventDefault()
        if (!email.includes('@')) {
            setModalErrs(['올바른 이메일을 입력해주세요.'])
            setModalOpen(true)
            return
        }
        setLoading(true);
        setError('')
        try {
            const data = await sendAuthCode(email)
            if (data.result !== 1) throw new Error(data.msg)

            // 이메일 마스킹 프론트에서 처리
            const [id, domain] = email.split('@')
            const masked = id.slice(0, 2) + '*'.repeat(id.length - 2) + '@' + domain
            setMasked(masked)
            setTimeLeft(CODE_EXPIRE)
            setStep(1)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setResending(true);
        setError('')
        try {
            await sendAuthCode(email);
            setTimeLeft(CODE_EXPIRE);
            setCode(['', '', '', '', '', '']);
            codeRefs.current[0]?.focus()
        } finally {
            setResending(false)
        }
    }

    const handleCodeChange = (idx, val) => {
        if (!/^\d*$/.test(val)) return
        const next = [...code];
        next[idx] = val.slice(-1);
        setCode(next)
        if (val && idx < 5) codeRefs.current[idx + 1]?.focus()
    }
    const handleCodeKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !code[idx] && idx > 0) codeRefs.current[idx - 1]?.focus()
    }
    const handleCodePaste = (e) => {
        const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (p.length === 6) {
            setCode(p.split(''));
            codeRefs.current[5]?.focus()
        }
        e.preventDefault()
    }

    const handleVerify = async (e) => {
        e.preventDefault()
        const codeStr = code.join('')
        if (codeStr.length < 6) {
            setModalErrs(['인증코드 6자리를 모두 입력해주세요.'])
            setModalOpen(true)
            return
        }
        setLoading(true);
        setError('')
        try {
            const data = await verifyAuthCode(email, codeStr)
            if (data.result !== 1) throw new Error(data.msg)
            setStep(2);
            setStep(2)
        } catch (err) {
            setError(err.message);
            setCode(['', '', '', '', '', '']);
            codeRefs.current[0]?.focus()
        } finally {
            setLoading(false)
        }
    }

    const pwOk = PW_RULES.every(r => r.test(password))
    const confirmOk = password === confirm && confirm.length > 0

    const handleReset = async (e) => {
        e.preventDefault();
        const errs = [];
        if (!pwOk) errs.push('비밀번호 조건을 모두 만족해야 합니다.');
        if (!confirmOk) errs.push('비밀번호가 일치하지 않습니다.');

        if (errs.length) {
            setModalErrs(errs);
            setModalOpen(true);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await updatePassword(email, password);

            if (data.result === 1) {
                // 성공 케이스
                setDone(true);
            } else if (data.result === 2) {
                // 기존 비밀번호와 동일한 경우 (특수 에러 처리)
                setModalErrs([data.msg]); // "새 비밀번호가 기존 비밀번호와 동일합니다..."
                setModalOpen(true);
                setPassword(''); // 입력창 초기화 (선택 사항)
                setConfirm('');
            } else {
                // 그 외 DB 오류 등
                throw new Error(data.msg || '비밀번호 변경 중 오류가 발생했습니다.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.page}>
            <Navbar/>
            <div className={styles.body}>
                <div className={styles.card}>
                    <div className={styles.logoWrap}>
                        <span className={styles.logoEmoji}>📸</span>
                        <span className={styles.logoText}>찍고먹어요</span>
                    </div>
                    <h1 className={styles.title}>비밀번호 찾기</h1>
                    <p className={styles.sub}>이메일 인증 후 새 비밀번호를 설정해요</p>

                    {/* 단계 표시 */}
                    {!done && (
                        <div className={styles.stepIndicator}>
                            {STEPS.map((label, idx) => (
                                <React.Fragment key={label}>
                                    <div
                                        className={`${styles.stepBubble} ${idx < step ? styles.stepBubbleDone : idx === step ? styles.stepBubbleActive : ''}`}>
                                        {idx < step ? <CheckCircle size={13}/> : idx + 1}
                                    </div>
                                    {idx < STEPS.length - 1 && <div
                                        className={`${styles.stepLine} ${idx < step ? styles.stepLineDone : ''}`}/>}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* 완료 */}
                    {done ? (
                        <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
                            <div className={styles.successBanner}>
                                <CheckCircle size={18} style={{flexShrink: 0}}/>
                                비밀번호가 성공적으로 변경되었습니다.
                            </div>
                            <button className={styles.submitBtn} onClick={() => navigate('/login')}>
                                로그인하러 가기 <ArrowRight size={16}/>
                            </button>
                        </div>

                        /* step 0 */
                    ) : step === 0 ? (
                        <form className={styles.form} onSubmit={handleSend} noValidate>
                            <div className={styles.fieldWrap}>
                                <label className={styles.label}>가입한 이메일</label>
                                <div className={styles.inputWrap}>
                                    <Mail size={16} className={styles.inputIcon}/>
                                    <input type="email" className={styles.input} placeholder="example@email.com"
                                           value={email} onChange={e => setEmail(e.target.value)} autoFocus/>
                                </div>
                                {error && <p className={styles.fieldErr}><AlertCircle size={11}/>{error}</p>}
                            </div>
                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? <span className={styles.spinner}/> : <><span>인증코드 전송</span><ArrowRight
                                    size={16}/></>}
                            </button>
                        </form>

                        /* step 1 */
                    ) : step === 1 ? (
                        <form className={styles.form} onSubmit={handleVerify} noValidate>
                            <div className={styles.successBanner} style={{marginBottom: 4}}>
                                <Mail size={16} style={{flexShrink: 0}}/>
                                <span><strong>{maskedEmail}</strong>으로 인증코드를 전송했습니다.</span>
                            </div>
                            <div className={styles.fieldWrap}>
                                <label className={styles.label}>
                                    인증코드 6자리
                                    {timeLeft > 0 && (
                                        <span style={{
                                            color: timeLeft < 60 ? '#F85149' : '#2ECC71',
                                            fontFamily: 'Space Mono,monospace',
                                            marginLeft: 8
                                        }}>
                      {mm}:{ss}
                    </span>
                                    )}
                                </label>
                                <div style={{display: 'flex', gap: 8, justifyContent: 'center'}}
                                     onPaste={handleCodePaste}>
                                    {code.map((digit, idx) => (
                                        <input key={idx} ref={el => (codeRefs.current[idx] = el)}
                                               type="text" inputMode="numeric" maxLength={1} value={digit}
                                               onChange={e => handleCodeChange(idx, e.target.value)}
                                               onKeyDown={e => handleCodeKeyDown(idx, e)}
                                               style={{
                                                   width: 44,
                                                   height: 52,
                                                   textAlign: 'center',
                                                   fontSize: 20,
                                                   fontWeight: 700,
                                                   fontFamily: 'Space Mono,monospace',
                                                   background: '#1C2330',
                                                   border: `1px solid ${digit ? 'rgba(46,204,113,0.4)' : 'rgba(255,255,255,0.07)'}`,
                                                   borderRadius: 10,
                                                   color: '#E6EDF3',
                                                   outline: 'none',
                                                   transition: 'border-color .15s',
                                               }}
                                        />
                                    ))}
                                </div>
                                {error && <p className={styles.fieldErr} style={{justifyContent: 'center'}}><AlertCircle
                                    size={11}/>{error}</p>}
                            </div>
                            <button type="submit" className={styles.submitBtn} disabled={loading || timeLeft === 0}>
                                {loading ? <span className={styles.spinner}/> : <><span>인증 확인</span><ArrowRight
                                    size={16}/></>}
                            </button>
                            <button type="button" className={styles.ghostBtn} onClick={handleResend}
                                    disabled={resending || timeLeft > 150}>
                                <RefreshCw size={14}/>{resending ? '전송 중...' : '인증코드 재전송'}
                            </button>
                        </form>

                        /* step 2 */
                    ) : (
                        <form className={styles.form} onSubmit={handleReset} noValidate>
                            <div className={styles.fieldWrap}>
                                <label className={styles.label}>새 비밀번호</label>
                                <div className={styles.inputWrap}>
                                    <Lock size={16} className={styles.inputIcon}/>
                                    <input type={showPw ? 'text' : 'password'} className={styles.input}
                                           placeholder="새 비밀번호 입력"
                                           value={password} onChange={e => setPassword(e.target.value)} autoFocus/>
                                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                                        {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                                    </button>
                                </div>
                                {password.length > 0 && (
                                    <div className={styles.pwRules}>
                                        {PW_RULES.map(r => (
                                            <span key={r.label}
                                                  className={`${styles.pwRule} ${r.test(password) ? styles.pwRuleOk : ''}`}>✓ {r.label}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className={styles.fieldWrap}>
                                <label className={styles.label}>비밀번호 확인</label>
                                <div
                                    className={`${styles.inputWrap} ${confirm && !confirmOk ? styles.inputError : confirm && confirmOk ? styles.inputOk : ''}`}>
                                    <Lock size={16} className={styles.inputIcon}/>
                                    <input type={showPw ? 'text' : 'password'} className={styles.input}
                                           placeholder="비밀번호 재입력"
                                           value={confirm} onChange={e => setConfirm(e.target.value)}/>
                                    {confirm && confirmOk &&
                                        <CheckCircle size={15} style={{color: '#2ECC71', flexShrink: 0}}/>}
                                </div>
                            </div>
                            {error && <div className={styles.serverErr}><AlertCircle size={14}/>{error}</div>}
                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? <span className={styles.spinner}/> : <><span>비밀번호 변경 완료</span><ArrowRight
                                    size={16}/></>}
                            </button>
                        </form>
                    )}

                    <div className={styles.bottomLinks}>
                        <div className={styles.bottomLinkRow}>
                            <Link to="/login" className={styles.linkBtn}><ChevronLeft size={12}
                                                                                      style={{verticalAlign: 'middle'}}/>로그인</Link>
                            <span className={styles.linkDivider}/>
                            <Link to="/find-id" className={styles.linkBtn}>아이디 찾기</Link>
                            <span className={styles.linkDivider}/>
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
