const express = require('express');
const errorControl = require('../middlewares/errorControl');
const CrudController = require('../controllers/crud.controller');
const respuesta = require('../utils/respuesta');

function crearCrudRouter(tabla, idCampo) {
    const router = express.Router();
    const crud = new CrudController(tabla, idCampo);

    router.get('/', errorControl(async (req, res) => {
        const datos = await crud.obtenerTodos();
        respuesta.exito(res, datos);
    }));

    router.get('/:id', errorControl(async (req, res) => {
        const dato = await crud.obtenerUno(req.params.id);
        if (!dato) {
            return respuesta.fallo(res, 'No encontrado', 404);
        }
        respuesta.exito(res, dato);
    }));

    router.post('/', errorControl(async (req, res) => {
        const nuevo = await crud.crear(req.body);
        respuesta.exito(res, nuevo, "Creado correctamente", 201);
    }));

    router.put('/:id', errorControl(async (req, res) => {
        const actualizado = await crud.actualizar(req.params.id, req.body);
        respuesta.exito(res, actualizado, "Actualizado correctamente");
    }));

    router.delete('/:id', errorControl(async (req, res) => {
        const eliminado = await crud.eliminar(req.params.id);
        respuesta.exito(res, eliminado, "Eliminado correctamente");
    }));

    return router;
}

module.exports = crearCrudRouter;
