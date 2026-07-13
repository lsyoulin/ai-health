import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Analyze from './pages/Analyze'
import Persona from './pages/Persona'
import Simulate from './pages/Simulate'
import Parent from './pages/Parent'
import Coach from './pages/Coach'
import Trends from './pages/Trends'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/persona" element={<Persona />} />
        <Route path="/simulate" element={<Simulate />} />
        <Route path="/parent" element={<Parent />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/trends" element={<Trends />} />
      </Routes>
    </Layout>
  )
}

export default App
