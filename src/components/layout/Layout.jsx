import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import styles from './Layout.module.css'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={styles.root}>
      {/* 상단 네비바: 모든 페이지에 공통 */}
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      {/* 슬라이드 사이드바 드로어 */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 페이지 컨텐츠 */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
