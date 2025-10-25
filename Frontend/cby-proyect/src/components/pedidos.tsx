import { useState } from 'react'
import "../styles/pedidos.css"


export default function Pedidos() {
    const [pedido, setPedido] = useState({
        fechaInicio: '',
        fechaEntrega: '',
        cliente: '',
        estado: 'Por iniciar',
        observaciones: '',
        abonoInicial: 0,
        totalPedido: 0,
        saldoPendiente: 0
    })

    return (
        <div className="pedidos-page">
            <h1 style={{marginBottom: 12}}>Gestión de Pedidos</h1>

            <div className="pedido-top">
                <div className="pedido-form card">
                    <h2>Información del Pedido</h2>

                    <div className="field">
                        <label>Fecha de Inicio:</label>
                        <input type="date" value={pedido.fechaInicio} onChange={(e) => setPedido({...pedido, fechaInicio: e.target.value})} />
                    </div>

                    <div className="field">
                        <label>Fecha de Entrega:</label>
                        <input type="date" value={pedido.fechaEntrega} onChange={(e) => setPedido({...pedido, fechaEntrega: e.target.value})} />
                    </div>

                    <div className="field">
                        <label>Cliente:</label>
                        <select value={pedido.cliente} onChange={(e) => setPedido({...pedido, cliente: e.target.value})}>
                            <option value="">Seleccionar cliente</option>
                        </select>
                        <button style={{marginTop:8}} className='NuevoCliente'>Nuevo Cliente</button>
                    </div>

                    <div className="field">
                        <label>Estado:</label>
                        <select value={pedido.estado} onChange={(e) => setPedido({...pedido, estado: e.target.value})}>
                            <option value="Por iniciar">Por iniciar</option>
                            <option value="En proceso">En proceso</option>
                            <option value="Finalizado">Finalizado</option>
                        </select>
                    </div>

                    <div className="field">
                        <label>Observaciones:</label>
                        <textarea
                            value={pedido.observaciones}
                            onChange={(e) => setPedido({...pedido, observaciones: e.target.value})}
                            placeholder="Observaciones adicionales del pedido"
                        />
                    </div>

                    <div className="field">
                        <label>Abono Inicial:</label>
                        <input
                            type="number"
                            value={pedido.abonoInicial}
                            onChange={(e) => setPedido({...pedido, abonoInicial: Number(e.target.value)})}
                        />
                    </div>

                    <div>
                        <p>Total del pedido: ${pedido.totalPedido}</p>
                        <p>Abono inicial: ${pedido.abonoInicial}</p>
                        <p>Saldo pendiente: ${pedido.saldoPendiente}</p>
                    </div>

                    <button className="btn-primary" style={{marginTop:10}}>Guardar Pedido</button>
                </div>

                <div className="cajones-section card">
                    <h2>Seleccionar Cajón</h2>
                    <div className="cajones-grid">
                        {[...Array(14)].map((_, index) => (
                            <div key={index} className="cajon">
                                Cajón {index + 1}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="prendas-section card">
                <h2>Gestión de Prendas</h2>
                <button className="btn-primary">Agregar Prenda</button>
            </div>
        </div>
    )
}
