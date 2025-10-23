async function cargarAjustes() {
  try {
    const res = await fetch("http://localhost:3000/api/ajustes");
    const ajustes = await res.json();

    const columnaAjustes = document.getElementById("columnaAjustes");
    const columnaAcciones = document.getElementById("columnaAcciones");

    // Ajustes (con check en cada ajuste)
    ajustes.forEach(ajuste => {
      const div = document.createElement("div");
      div.classList.add("grupo-ajuste");

      const label = document.createElement("label");
      label.innerHTML = `
        <input type="checkbox" name="ajuste" value="${ajuste.id_ajuste}">
        ${ajuste.nombre_ajuste}
      `;

      div.appendChild(label);
      columnaAjustes.appendChild(div);
    });

    // Acciones (reunir todas las acciones distintas de la BD)
    const todasAcciones = new Map();
    ajustes.forEach(ajuste => {
      ajuste.acciones.forEach(acc => {
        todasAcciones.set(acc.id_accion, acc);
      });
    });

    todasAcciones.forEach(acc => {
      const precio = Number(acc.precio); // convertir a número

      const label = document.createElement("label");
      label.innerHTML = `
        <input type="checkbox" name="accion" value="${acc.id_accion}">
        ${acc.nombre_accion} ($${isNaN(precio) ? '0.00' : precio.toFixed(2)})
      `;
      columnaAcciones.appendChild(label);
      columnaAcciones.appendChild(document.createElement("br"));
    });

  } catch (err) {
    console.error("Error cargando ajustes:", err);
  }
}

cargarAjustes();
