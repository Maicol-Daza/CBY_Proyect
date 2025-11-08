import React from "react";
import LayoutPublic from "../components/layout/LayoutPublic";
import ConfiguracionAjustesComponent from "../components/configuracionAjustes";
export default function ConfiguracionAjustes() {
    return (
        <LayoutPublic>
            <main className="configuracionAjustesPage">
                <ConfiguracionAjustesComponent />
            </main>
        </LayoutPublic>
    );
}
