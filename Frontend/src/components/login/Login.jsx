import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/Login.css";

export const Login = () => {
    const { login, user } = useAuthContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showRecuperacion, setShowRecuperacion] = useState(false);
    const [emailRecuperacion, setEmailRecuperacion] = useState("");
    const [codigoRecuperacion, setCodigoRecuperacion] = useState("");
    const [nuevaContraseña, setNuevaContraseña] = useState("");
    const [confirmarContraseña, setConfirmarContraseña] = useState("");
    const [mensajeRecuperacion, setMensajeRecuperacion] = useState("");
    const [errorRecuperacion, setErrorRecuperacion] = useState("");
    const [cargando, setCargando] = useState(false);
    const [pasoRecuperacion, setPasoRecuperacion] = useState(1); // 1: email, 2: código, 3: contraseña
    const [codigoValido, setCodigoValido] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const usuario = await login(email, password);
            if (usuario) {
                const rol = usuario.rol || user?.rol;
                if (rol === "Administrador") navigate("/usuarios");
                else navigate("/pedidos");
            }
        } catch (err) {
            // Mostrar mensajes específicos según el error
            if (err.message === "Usuario no encontrado") {
                setErrorMsg("El email no coincide con ninguna cuenta registrada.");
            } else if (err.message === "Contraseña incorrecta") {
                setErrorMsg("La contraseña es incorrecta.");
            } else {
                setErrorMsg("Ocurrió un error al iniciar sesión. Intenta de nuevo.");
            }
        }
    };

    const handleSolicitarRecuperacion = async (e) => {
        e.preventDefault();
        setMensajeRecuperacion("");
        setErrorRecuperacion("");
        setCargando(true);

        try {
            const response = await fetch("http://localhost:3000/api/email/solicitar-recuperacion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailRecuperacion })
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorRecuperacion(data.error || "Error al enviar el código");
                return;
            }

            setMensajeRecuperacion(data.mensaje);
            setPasoRecuperacion(2); // Ir al paso de verificación de código
        } catch (err) {
            console.error("Error:", err);
            setErrorRecuperacion("Error al procesar la solicitud");
        } finally {
            setCargando(false);
        }
    };

    // Nueva función: Verificar código
    const handleVerificarCodigo = async (e) => {
        e.preventDefault();
        setErrorRecuperacion("");
        setMensajeRecuperacion("");

        if (!codigoRecuperacion) {
            setErrorRecuperacion("Por favor ingresa el código");
            return;
        }

        if (codigoRecuperacion.length !== 6) {
            setErrorRecuperacion("El código debe tener 6 dígitos");
            return;
        }

        setCargando(true);

        try {
            // Aquí solo verificamos que el código sea válido
            const response = await fetch("http://localhost:3000/api/email/verificar-codigo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailRecuperacion,
                    codigo: codigoRecuperacion
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorRecuperacion(data.error || "Código incorrecto");
                return;
            }

            setMensajeRecuperacion(data.mensaje);
            setCodigoValido(true);
            setTimeout(() => {
                setPasoRecuperacion(3); // Ir al paso de cambiar contraseña
                setMensajeRecuperacion("");
            }, 1000);
        } catch (err) {
            console.error("Error:", err);
            setErrorRecuperacion("Error al verificar el código");
        } finally {
            setCargando(false);
        }
    };

    const handleCambiarContraseña = async (e) => {
        e.preventDefault();
        setErrorRecuperacion("");
        setMensajeRecuperacion("");

        if (!nuevaContraseña || !confirmarContraseña) {
            setErrorRecuperacion("Por favor completa todos los campos");
            return;
        }

        if (nuevaContraseña.length < 6) {
            setErrorRecuperacion("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        if (nuevaContraseña !== confirmarContraseña) {
            setErrorRecuperacion("Las contraseñas no coinciden");
            return;
        }

        setCargando(true);

        try {
            // ⭐ CAMBIAR ESTA URL
            const response = await fetch("http://localhost:3000/api/email/cambiar-contrasena", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailRecuperacion,
                    codigo: codigoRecuperacion,
                    nuevaContraseña
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorRecuperacion(data.error || "Error al cambiar la contraseña");
                return;
            }

            setMensajeRecuperacion(data.mensaje);
            setTimeout(() => {
                limpiarRecuperacion();
            }, 2000);
        } catch (err) {
            console.error("Error:", err);
            setErrorRecuperacion("Error al procesar la solicitud");
        } finally {
            setCargando(false);
        }
    };

    const limpiarRecuperacion = () => {
        setShowRecuperacion(false);
        setPasoRecuperacion(1);
        setEmailRecuperacion("");
        setCodigoRecuperacion("");
        setNuevaContraseña("");
        setConfirmarContraseña("");
        setErrorRecuperacion("");
        setMensajeRecuperacion("");
        setCodigoValido(false);
    };

    if (showRecuperacion) {
        return (
            <div className="login-fondo">
                <div className="login-tarjeta">
                    {pasoRecuperacion === 1 && (
                        <>
                            <h2 className="login-titulo">Recuperar Contraseña</h2>
                            <form className="login-formulario" onSubmit={handleSolicitarRecuperacion}>
                                <label className="login-label" htmlFor="emailRecuperacion">
                                    Ingresa tu email:
                                </label>
                                <input
                                    className="login-input"
                                    type="email"
                                    id="emailRecuperacion"
                                    value={emailRecuperacion}
                                    onChange={(e) => {
                                        setEmailRecuperacion(e.target.value);
                                        setErrorRecuperacion("");
                                    }}
                                    placeholder="tu@email.com"
                                    required
                                />

                                {errorRecuperacion && (
                                    <p style={{ color: '#e63946', margin: '6px 0', fontSize: '14px' }}>
                                        {errorRecuperacion}
                                    </p>
                                )}
                                {mensajeRecuperacion && (
                                    <p style={{ color: '#06a77d', margin: '6px 0', fontSize: '14px' }}>
                                        {mensajeRecuperacion}
                                    </p>
                                )}

                                <button 
                                    className="btn-login" 
                                    type="submit"
                                    disabled={cargando}
                                    style={{ opacity: cargando ? 0.6 : 1 }}
                                >
                                    {cargando ? "Enviando..." : "Enviar Código"}
                                </button>
                            </form>
                        </>
                    )}

                    {pasoRecuperacion === 2 && (
                        <>
                            <h2 className="login-titulo">Verificar Código</h2>
                            <form className="login-formulario" onSubmit={handleVerificarCodigo}>
                                <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                                    Ingresa el código de 6 dígitos que recibiste en <strong>{emailRecuperacion}</strong>
                                </p>

                                <label className="login-label" htmlFor="codigo">
                                    Código:
                                </label>
                                <input
                                    className="login-input"
                                    type="text"
                                    id="codigo"
                                    value={codigoRecuperacion}
                                    onChange={(e) => {
                                        setCodigoRecuperacion(e.target.value.replace(/\D/g, '').slice(0, 6));
                                        setErrorRecuperacion("");
                                    }}
                                    placeholder="123456"
                                    maxLength="6"
                                    required
                                />

                                {errorRecuperacion && (
                                    <p style={{ color: '#e63946', margin: '10px 0', fontSize: '14px' }}>
                                        {errorRecuperacion}
                                    </p>
                                )}
                                {mensajeRecuperacion && (
                                    <p style={{ color: '#06a77d', margin: '10px 0', fontSize: '14px' }}>
                                        {mensajeRecuperacion}
                                    </p>
                                )}

                                <button 
                                    className="btn-login" 
                                    type="submit"
                                    disabled={cargando}
                                    style={{ opacity: cargando ? 0.6 : 1 }}
                                >
                                    {cargando ? "Verificando..." : "Verificar Código"}
                                </button>
                            </form>

                            <p className="login-texto" style={{ marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPasoRecuperacion(1);
                                        setCodigoRecuperacion("");
                                        setErrorRecuperacion("");
                                        setMensajeRecuperacion("");
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'rgb(17, 161, 194)',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        padding: 0
                                    }}
                                >
                                    ← Volver atrás
                                </button>
                            </p>
                        </>
                    )}

                    {pasoRecuperacion === 3 && codigoValido && (
                        <>
                            <h2 className="login-titulo">Nueva Contraseña</h2>
                            <form className="login-formulario" onSubmit={handleCambiarContraseña}>
                                <label className="login-label" htmlFor="nuevaContraseña">
                                    Nueva Contraseña:
                                </label>
                                <input
                                    className="login-input"
                                    type="password"
                                    id="nuevaContraseña"
                                    value={nuevaContraseña}
                                    onChange={(e) => {
                                        setNuevaContraseña(e.target.value);
                                        setErrorRecuperacion("");
                                    }}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                />

                                <label className="login-label" htmlFor="confirmarContraseña">
                                    Confirmar Contraseña:
                                </label>
                                <input
                                    className="login-input"
                                    type="password"
                                    id="confirmarContraseña"
                                    value={confirmarContraseña}
                                    onChange={(e) => {
                                        setConfirmarContraseña(e.target.value);
                                        setErrorRecuperacion("");
                                    }}
                                    placeholder="Repite tu contraseña"
                                    required
                                />

                                {errorRecuperacion && (
                                    <p style={{ color: '#e63946', margin: '10px 0', fontSize: '14px' }}>
                                        {errorRecuperacion}
                                    </p>
                                )}
                                {mensajeRecuperacion && (
                                    <p style={{ color: '#06a77d', margin: '10px 0', fontSize: '14px' }}>
                                        {mensajeRecuperacion}
                                    </p>
                                )}

                                <button 
                                    className="btn-login" 
                                    type="submit"
                                    disabled={cargando}
                                    style={{ opacity: cargando ? 0.6 : 1 }}
                                >
                                    {cargando ? "Cambiando..." : "Cambiar Contraseña"}
                                </button>
                            </form>

                            <p className="login-texto" style={{ marginTop: '10px' }}>
                                {/* <button
                                    type="button"
                                    onClick={() => {
                                        setPasoRecuperacion(2);
                                        setNuevaContraseña("");
                                        setConfirmarContraseña("");
                                        setErrorRecuperacion("");
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'rgb(17, 161, 194)',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        padding: 0
                                    }}
                                >
                                    ← Volver atrás
                                </button> */}
                            </p>
                        </>
                    )}

                    <p className="login-texto" style={{ marginTop: '15px' }}>
                        <button
                            type="button"
                            onClick={limpiarRecuperacion}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgb(17, 161, 194)',
                                fontWeight: '700',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: 0
                            }}
                        >
                            Volver al inicio de sesión
                        </button>
                    </p>
                </div>
            </div>
        );
    }

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
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (errorMsg) setErrorMsg("");
                        }}
                        placeholder="tu@email.com"
                        required
                    />
                    {errorMsg && (
                        <p style={{ color: '#e63946', margin: '6px 0 0', fontSize: '14px' }}>
                            {errorMsg}
                        </p>
                    )}

                    <label className="login-label" htmlFor="password">Contraseña:</label>
                    <input
                        className="login-input"
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (errorMsg) setErrorMsg("");
                        }}
                        placeholder="Tu contraseña"
                        required
                    />

                    <button className="btn-login" type="submit">
                        Iniciar Sesión
                    </button>
                </form>

                <p className="login-texto">
                    ¿Olvidaste tu contraseña?{" "}
                    <button
                        type="button"
                        onClick={() => setShowRecuperacion(true)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgb(17, 161, 194)',
                            fontWeight: '700',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0
                        }}
                    >
                        Recupérala aquí
                    </button>
                </p>

                {/* <p className="login-texto">
                    ¿No tienes cuenta?{" "}
                    <Link 
                        className="login-enlace" 
                        to="/registro"
                        style={{
                            color: 'rgb(17, 161, 194)',
                            fontWeight: '700',
                            textDecoration: 'underline'
                        }}
                    >
                        Regístrate
                    </Link>
                </p> */}
            </div>
        </div>
    );
};

export default Login;
