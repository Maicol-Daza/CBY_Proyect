import { Header } from "./Header";

export const Layout = ({ children }) => {
    return (
        <div>
        <Header />
        <main style={{ padding: "20px" }}>
            {children}
        </main>
        </div>
    );
};