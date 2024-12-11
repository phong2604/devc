import Header from './components/header.js';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Addcard from './pages/add-card.js';
import Account from './pages/account.js';
import Decks from './pages/decks.js';
function App() {
  return(
    <Router>

    <Header />
    <Routes>
        <Route path="/add-card" element={<Addcard />} />
        <Route path="/decks" element={<Decks />} />
        <Route path="/account" element={<Account />} />
        <Route path="/checkpoint" element={<Account />} />
        {/* Add other routes here */}
      </Routes>
    </Router>
  )
}

export default App;
