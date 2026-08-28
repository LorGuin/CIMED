import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Hero from './components/Hero'
import About from './components/About'
import Specialties from './components/Specialties'
import LocationContact from './components/LocationContact'
import Instagram from './components/Instagram'
import Footer from './components/Footer'
import './App.scss'

function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__main">
        <TopBar />
        <main>
          <Hero />
          <About />
          <Specialties />
          <LocationContact />
          <Instagram />
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default App
