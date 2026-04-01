import React from 'react'
import styles from './Button.module.css'

export default function Button({
  children,
  variant = 'primary',  // primary | secondary | ghost | danger
  size = 'md',          // sm | md | lg
  loading = false,
  disabled = false,
  icon,
  onClick,
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${loading ? styles.loading : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && <span className={styles.spinner} />}
      {!loading && icon && <span className={styles.icon}>{icon}</span>}
      <span>{children}</span>
    </button>
  )
}
