import { Outlet, Link } from 'react-router-dom'

export default function Layout() {
    return (
        <>

            <Link to="/">inicio</Link>
            <Link to="/clientes">clientes</Link>
            <Link to="/pedidos">pedidos</Link>
            <Link to="/historialPedidos">historialPedidos</Link>
            <Link to="/moduloCaja">moduloCaja</Link>
            <Link to="/configAjustes">configAjustes</Link>
            <Outlet />
        </>
    )
}