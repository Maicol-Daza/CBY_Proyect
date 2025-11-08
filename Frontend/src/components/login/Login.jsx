import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export const Login = () => {
    const { login, user } = useAuthContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        // login ahora devuelve el usuario (o null). Usamos el usuario retornado
        // para evitar condiciones de carrera con el contexto.
        try {
            const usuario = await login(email, password);
            if (usuario) {
                const rol = usuario.rol || user?.rol;
                if (rol === "Administrador") {
                    navigate("/principal");
                } else {
                    navigate("/bienvenido");
                }
            } else {
                alert("Credenciales inválidas");
            }
        } catch (err) {
            console.error("Error en login:", err);
            alert("Ocurrió un error al iniciar sesión. Intenta de nuevo.");
        }
    };

    return (
        <div className="login-fondo">
            <div className="login-tarjeta">
                <h2 className="login-titulo">Inicio de Sesión</h2>
                <form className="login-formulario" onSubmit={handleSubmit}>
                    <label className="login-label" htmlFor="email">Email:</label>
                    <input
                        className="login-input"
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label className="login-label" htmlFor="password">Contraseña:</label>
                    <input
                        className="login-input"
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button className="btn-login" type="submit">Iniciar</button>
                </form>

                <p className="login-texto">
                    ¿No tienes cuenta?{" "}
                    <Link className="login-enlace" to="/registro">Regístrate</Link>
                </p>
            </div>
        </div>
    );
};
