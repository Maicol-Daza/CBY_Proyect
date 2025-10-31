// import { useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './pages/Layout'
import Inicio from './pages/inicio'
import Clientes from './pages/clientes'
import Header from './components/header'
import Pedidos from './pages/pedidos'
import HistorialPedidos from './pages/historialPedidos'
import ModuloCaja from './pages/moduloCaja'
import ConfiguracionAjustes from './pages/configuracionAjustes'

function App() {
  

  return (
    <>
    <div className="App">

    <BrowserRouter>
      <Header  />
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/historialPedidos" element={<HistorialPedidos />} />
          <Route path="/moduloCaja" element={<ModuloCaja />} />
          <Route path="/configuracionAjustes" element={<ConfiguracionAjustes />} />
        </Routes>
      </main>
    </BrowserRouter>

    </div>
    
    </>
  )
}

export default App
