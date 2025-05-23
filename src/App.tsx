import { Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import AccountPage from './pages/AccountPage'
import NewArranke from './pages/NewArranke'
import Arranke from './pages/Arranke'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<div>About Page</div>} />
      <Route path="/projects" element={<div>Projects Page</div>} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/profile" element={<AccountPage />} />
      <Route path="/newArranke" element={<NewArranke />} />
      <Route path="/:projectName" element={<Arranke />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  )
}

export default App
