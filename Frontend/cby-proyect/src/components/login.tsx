import React, { useState } from "react";

export default function Login() {
    const [credentials, setCredentials] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aquí puedes agregar la lógica de autenticación
        console.log("Credenciales:", credentials);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
                    Clínica del Bluyin
                </h1>
                <h2 className="text-center text-gray-600 mb-6">
                    Sistema de Gestión de Ajustes
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Usuario</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Ingrese su email"
                            className="w-full p-2 border rounded-md"
                            value={credentials.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Ingrese su contraseña"
                            className="w-full p-2 border rounded-md"
                            value={credentials.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                    >
                        Iniciar Sesión
                    </button>
                </form>
            </div>
        </div>
    );
}