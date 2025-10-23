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
      const precio = Number(acc.precio);

      const label = document.createElement("label");
      label.innerHTML = `
        <input type="checkbox" name="accion" value="${acc.id_accion}">
        ${acc.nombre_accion} ($${isNaN(precio) ? '0.00' : precio.toFixed(2)})
      `;
      columnaAcciones.appendChild(label);
      columnaAcciones.appendChild(document.createElement("br"));
    });

    // === Evento Guardar Combinación ===
    document.getElementById("guardarCombinacion").addEventListener("click", () => {
      const seleccionAjustes = [...document.querySelectorAll('input[name="ajuste"]:checked')];
      const seleccionAcciones = [...document.querySelectorAll('input[name="accion"]:checked')];

      if (seleccionAjustes.length === 0 || seleccionAcciones.length === 0) {
        alert("Debes seleccionar al menos un ajuste y una acción.");
        return;
      }

      // Generar combinaciones (cada ajuste con cada acción)
      const nuevasCombinaciones = [];
      seleccionAjustes.forEach(ajuste => {
        seleccionAcciones.forEach(accion => {
          nuevasCombinaciones.push({
            ajusteId: ajuste.value,
            ajusteNombre: ajuste.parentElement.textContent.trim(),
            accionId: accion.value,
            accionNombre: accion.parentElement.textContent.trim()
          });
        });
      });

      // Guardar en localStorage
      let combinaciones = JSON.parse(localStorage.getItem("combinaciones")) || [];
      combinaciones = [...combinaciones, ...nuevasCombinaciones];
      localStorage.setItem("combinaciones", JSON.stringify(combinaciones));

      alert("Combinaciones guardadas en localStorage ✅");
      console.log("Combinaciones actuales:", combinaciones);
    });

  } catch (err) {
    console.error("Error cargando ajustes:", err);
  }
}

cargarAjustes();
