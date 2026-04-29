import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import NuevaRevision from './pages/NuevaRevision'
import Registros from './pages/Registros'
import Alertas from './pages/Alertas'
import AsistenciaSRL from './pages/AsistenciaSRL'
import Buses from './pages/Buses'
import Configuracion from './pages/Configuracion'
import { useToast } from './hooks/useToast'

function AppContent() {
  const { toasts, toast, removeToast } = useToast()

  return (
    <MainLayout toasts={toasts} onRemoveToast={removeToast}>
      {({ onMenuToggle }) => (
        <Routes>
          <Route path="/"               element={<Dashboard      onMenuToggle={onMenuToggle} toast={toast} />} />
          <Route path="/nueva-revision" element={<NuevaRevision  onMenuToggle={onMenuToggle} toast={toast} />} />
          <Route path="/registros"      element={<Registros      onMenuToggle={onMenuToggle} toast={toast} />} />
          <Route path="/alertas"        element={<Alertas        onMenuToggle={onMenuToggle} toast={toast} />} />
          <Route path="/srl"            element={<AsistenciaSRL  onMenuToggle={onMenuToggle} toast={toast} />} />
          <Route path="/buses"          element={<Buses          onMenuToggle={onMenuToggle} toast={toast} />} />
          <Route path="/configuracion"  element={<Configuracion  onMenuToggle={onMenuToggle} toast={toast} />} />
        </Routes>
      )}
    </MainLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
