const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/conexion_DB'); // importante para hacer consultas

const crearCrudRouter = require('./routes/crud.routes');
const tablasConfig = require('./config/tablas');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ruta para obtener todas las tablas disponibles
app.get('/api/tablas', (req, res) => {
    res.json(Object.keys(tablasConfig));
});

// 🔹 Ruta para obtener metadata de una tabla
app.get('/api/:tabla/meta', async (req, res) => {
    const tabla = req.params.tabla;
    const idCampo = tablasConfig[tabla];

    if (!idCampo) {
        return res.status(404).json({ error: 'Tabla no registrada en la configuración' });
    }

    try {
        const [columns] = await db.query(`SHOW COLUMNS FROM ??`, [tabla]);
        res.json({
            tabla,
            idCampo,
            columnas: columns.map(c => c.Field)
    });
        } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
        }
});

//Ruta de cajones y códigos para verificación con Joins luego va aparte
app.get('/api/cajones-con-codigos', async (req, res) => {
    try {
        const [rows] = await db.query(`
    SELECT c.id_cajon, c.nombre_cajon, cod.id_codigo, cod.codigo_numero AS codigo
    FROM cajones c
    JOIN codigos cod ON c.id_cajon = cod.id_cajon
    ORDER BY c.id_cajon, cod.codigo_numero
`);

        // Agrupar por cajón
        const resultado = rows.reduce((acc, row) => {
            let cajon = acc.find(c => c.id_cajon === row.id_cajon);
            if (!cajon) {
                cajon = { 
                    id_cajon: row.id_cajon, 
                    nombre_cajon: row.nombre_cajon, 
                    codigos: [] 
                };
                acc.push(cajon);
            }
            cajon.codigos.push({ id_codigo: row.id_codigo, codigo: row.codigo });
            return acc;
        }, []);

        res.json(resultado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Ruta de ajustes y posibles combos
app.get('/api/ajustes', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                a.id_ajuste, 
                a.nombre_ajuste, 
                ac.id_accion, 
                acc.nombre_accion, 
                ac.precio
            FROM ajustes a
            JOIN ajustes_accion ac ON a.id_ajuste = ac.id_ajuste
            JOIN acciones acc ON ac.id_accion = acc.id_accion
            ORDER BY a.id_ajuste, ac.id_accion
        `);

        // Agrupar ajustes con sus acciones
        const resultado = rows.reduce((acc, row) => {
            let ajuste = acc.find(a => a.id_ajuste === row.id_ajuste);
            if (!ajuste) {
                ajuste = { 
                    id_ajuste: row.id_ajuste, 
                    nombre_ajuste: row.nombre_ajuste, 
                    acciones: [] 
                };
                acc.push(ajuste);
            }
            ajuste.acciones.push({
                id_accion: row.id_accion,
                nombre_accion: row.nombre_accion,
                precio: row.precio
            });
            return acc;
        }, []);

        res.json(resultado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});




// 🔹 Ruta dinámica para CRUD
app.use('/api/:tabla', (req, res, next) => {
    const tabla = req.params.tabla;
    const idCampo = tablasConfig[tabla];

    if (!idCampo) {
        return res.status(404).json({ error: 'Tabla no registrada en la configuración' });
    }

    return crearCrudRouter(tabla, idCampo)(req, res, next);
});

// Middleware global de errores
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message });
});

module.exports = app;
