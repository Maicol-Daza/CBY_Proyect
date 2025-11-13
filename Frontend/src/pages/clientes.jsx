import LayoutPublic from "../components/layout/LayoutPublic";
import ClientesModule from "../components/clientesModule";

export const Clientes = () => (
    <LayoutPublic>
         <main className="pedidosPage">
               <ClientesModule />
            </main>
    </LayoutPublic>
);

export default Clientes;