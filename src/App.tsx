import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthRedirect } from './components/AuthRedirect'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProfilePage } from './pages/ProfilePage'
import { RankingPage } from './pages/RankingPage'
import { GamesPage } from './pages/GamesPage'
import { GameDetailPage } from './pages/GameDetailPage'
import { PlayersPage } from './pages/PlayersPage'
import { NewGamePage } from './pages/NewGamePage'
import { EditGamePage } from './pages/EditGamePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthRedirect>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/new" element={<NewGamePage />} />
          <Route path="/games/:gameId/edit" element={<EditGamePage />} />
          <Route path="/games/:gameId" element={<GameDetailPage />} />
          <Route path="/players" element={<PlayersPage />} />
        </Routes>
      </AuthRedirect>
    </BrowserRouter>
  )
}
