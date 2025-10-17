import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home.jsx'
import PostPage from './components/PostPage.jsx';
import './App.css'

function App() {

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/writing/new" element={<PostPage />} />
          <Route path="/writing/:id" element={<PostPage />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
