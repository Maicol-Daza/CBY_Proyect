import React from "react";
import LayoutPublic from "../components/layout/LayoutPublic";
import PedidosComponent from "../components/pedidos"; // renombrado para evitar conflicto

export default function Pedidos() {
    return (
        <LayoutPublic>
            <main className="pedidosPage">
                <h1>Pedidos</h1>
                <PedidosComponent />
            </main>
        </LayoutPublic>
    );
}
