import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Analyze from './pages/Analyze'
import Persona from './pages/Persona'
import Simulate from './pages/Simulate'
import Parent from './pages/Parent'
import Coach from './pages/Coach'
import Trends from './pages/Trends'
import Legal from './pages/Legal'
import Auth from './pages/Auth'

function App() {
  return (
    <Layout>
      <Routes>
        {/* 公开路由（Demo 体验核心路径） */}
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/simulate" element={<Simulate />} />
        <Route path="/parent" element={<Parent />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/legal/:docType" element={<Legal />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/auth" element={<Auth />} />

        {/* 受保护路由（需登录） */}
        <Route
          path="/persona"
          element={
            <ProtectedRoute>
              <Persona />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  )
}

export default App
