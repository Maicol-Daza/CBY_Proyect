import { useState } from "react";
import { crearUsuario } from "../../services/usuarioService";
import validators from "../../utils/validators";
import { Link , useNavigate } from "react-router-dom";
import "./Registro.css";

export const Registro = () => {
    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        clave: "",
    });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [errores, setErrores] = useState({});
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones cliente-side
        const nuevosErrores = {};
        if (!formData.nombre || !validators.isValidName(formData.nombre)) nuevosErrores.nombre = validators.ERR.nombre;
        if (!formData.email || !validators.isValidEmail(formData.email)) nuevosErrores.email = validators.ERR.email;
        if (!formData.clave || formData.clave.trim().length < 6) nuevosErrores.clave = 'La clave debe tener al menos 6 caracteres.';

        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return;

        try {
            const data = await crearUsuario(formData);
            setSuccess("Usuario registrado correctamente");
            setError(null);
            setFormData({ nombre: "", email: "", clave: "", id_rol: "" });
            setTimeout(() => {
                navigate("/");
            }, 1000);
        } catch (err) {
            setError(err.message);
            setSuccess(null);
        }
    };

    return (
        <div className="registro-fondo">
            <div className="registro-tarjeta">
                <h2 className="registro-titulo">Registro de Usuario</h2>
                <form className="registro-formulario" onSubmit={handleSubmit}>
                    <div className="registro-grupo">
                        <label className="registro-etiqueta">Nombre</label>
                        <input
                            className="registro-entrada"
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                        />
                        {errores.nombre && <p className="registro-error" style={{ color: '#e63946' }}>{errores.nombre}</p>}
                    </div>

                    <div className="registro-grupo">
                        <label className="registro-etiqueta">Email</label>
                        <input
                            className="registro-entrada"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        {errores.email && <p className="registro-error" style={{ color: '#e63946' }}>{errores.email}</p>}
                    </div>

                    <div className="registro-grupo">
                        <label className="registro-etiqueta">Clave</label>
                        <input
                            className="registro-entrada"
                            type="password"
                            name="clave"
                            value={formData.clave}
                            onChange={handleChange}
                            required
                        />
                        {errores.clave && <p className="registro-error" style={{ color: '#e63946' }}>{errores.clave}</p>}
                    </div>

                    <button className="registro-boton" type="submit">Registrar</button>
                </form>

                {error && <p className="registro-error">{error}</p>}
                {success && <p className="registro-exito">{success}</p>}

                <p className="registro-texto">
                    ¿Ya tienes cuenta?{" "}
                    <Link className="registro-enlace" to="/">Inicia sesión</Link>
                </p>
            </div>
        </div>
    );
};
