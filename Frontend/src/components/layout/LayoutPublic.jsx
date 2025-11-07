import HeaderPublic from "../header"; // header.tsx
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const LayoutPublic = ({ children }) => {
    const { user, logout } = useAuthContext();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div>
            <HeaderPublic user={{ name: user?.nombre || "", role: user?.rol || "" }} onLogout={handleLogout} />
            <main style={{ padding: "20px" }}>
                {children}
            </main>
        </div>
    );
};

export default LayoutPublic;