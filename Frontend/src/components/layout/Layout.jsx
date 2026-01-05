import { Header } from "./Header";

export const Layout = ({ children }) => {
    return (
        <div style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Header />
            <main style={{ 
                flex: 1,
                width: "100%",
                maxWidth: "100%",
                padding: "20px",
                boxSizing: "border-box"
            }}>
                {children}
            </main>
        </div>
    );
};