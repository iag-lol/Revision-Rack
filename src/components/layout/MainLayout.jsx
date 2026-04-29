import { useState } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import ToastContainer from '../ui/Toast'

export default function MainLayout({ children, toasts, onRemoveToast }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 pb-20 lg:pb-6">
          {typeof children === 'function'
            ? children({ onMenuToggle: () => setMobileSidebarOpen(v => !v) })
            : children
          }
        </main>
      </div>

      <BottomNav />

      <ToastContainer toasts={toasts} onRemove={onRemoveToast} />
    </div>
  )
}
