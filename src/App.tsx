import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { RankingPage } from './pages/RankingPage'
import { GamesPage } from './pages/GamesPage'
import { GameDetailPage } from './pages/GameDetailPage'
import { PlayersPage } from './pages/PlayersPage'
import { NewGamePage } from './pages/NewGamePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/new" element={<NewGamePage />} />
        <Route path="/games/:gameId" element={<GameDetailPage />} />
        <Route path="/players" element={<PlayersPage />} />
      </Routes>
    </BrowserRouter>
  )
}
