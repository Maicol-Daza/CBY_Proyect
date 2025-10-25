const db = require('../config/conexion_db');

class ClientesController {
    // Obtener todos los clientes
    async obtenerClientes(req, res) {
        try {
            const [clientes] = await db.query(
                `SELECT id_cliente, nombre, nuip, direccion, telefono, email FROM clientes`
            );
            res.json(clientes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener clientes' });
        }
    }

    // Obtener cliente por ID
    async obtenerClientePorId(req, res) {
        const { id } = req.params;
        try {
            const [cliente] = await db.query(
                `SELECT id_cliente, nombre, nuip, direccion, telefono, email 
         FROM clientes WHERE id_cliente = ?`,
                [id]
            );

            if (cliente.length === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }

            res.json(cliente[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener cliente' });
        }
    }

    // Agregar cliente
    async agregarCliente(req, res) {
        const { nombre, nuip, direccion, telefono, email } = req.body;
        try {
            await db.query(
                `INSERT INTO clientes (nombre, nuip, direccion, telefono, email)
         VALUES (?, ?, ?, ?, ?)`,
                [nombre, nuip, direccion, telefono, email]
            );
            res.json({ mensaje: 'Cliente agregado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al agregar cliente' });
        }
    }

    // Actualizar cliente
    async actualizarCliente(req, res) {
        const { id } = req.params;
        const { nombre, nuip, direccion, telefono, email } = req.body;

        try {
            await db.query(
                `UPDATE clientes
         SET nombre = ?, nuip = ?, direccion = ?, telefono = ?, email = ?
         WHERE id_cliente = ?`,
                [nombre, nuip, direccion, telefono, email, id]
            );
            res.json({ mensaje: 'Cliente actualizado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar cliente' });
        }
    }

    // Eliminar cliente
    async eliminarCliente(req, res) {
        const { id } = req.params;
        try {
            await db.query(`DELETE FROM clientes WHERE id_cliente = ?`, [id]);
            res.json({ mensaje: 'Cliente eliminado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar cliente' });
        }
    }
}

module.exports = ClientesController;
