import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Landing from '../pages/Landing'
import SelectSport from '../pages/SelectSport'
import SelectCut from '../pages/SelectCut'
import SelectColor from '../pages/SelectColor'
import Editor from '../pages/Editor'
import SharedDesign from '../pages/SharedDesign'
import CartPage from '../features/cart/CartPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sport" element={<SelectSport />} />
        <Route path="/sport/:sport/cut" element={<SelectCut />} />
        <Route path="/sport/:sport/cut/:cut/color" element={<SelectColor />} />
        <Route path="/sport/:sport/cut/:cut/color/:color" element={<Editor />} />
        <Route path="/d/:code" element={<SharedDesign />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}