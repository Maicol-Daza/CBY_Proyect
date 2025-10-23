    let cajones = [];

    // Cargar cajones y códigos
    fetch("http://localhost:3000/api/cajones-con-codigos")
      .then(res => res.json())
      .then(data => {
        cajones = data;
        const select = document.getElementById("selectCajon");
        cajones.forEach(c => {
          const option = document.createElement("option");
          option.value = c.id_cajon;
          option.textContent = c.nombre_cajon;
          select.appendChild(option);
        });
      });

    // Cuando seleccionan un cajón → mostrar sus códigos
    document.getElementById("selectCajon").addEventListener("change", (e) => {
      const id = parseInt(e.target.value);
      const contenedor = document.getElementById("codigosContainer");
      contenedor.innerHTML = "";

      const cajon = cajones.find(c => c.id_cajon === id);
      if (cajon) {
        cajon.codigos.forEach(cod => {
          const label = document.createElement("label");
          label.classList.add("codigo-item");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.value = cod.id_codigo;
          label.appendChild(checkbox);
          label.append(" " + cod.codigo);
          contenedor.appendChild(label);
        });
      }
    });
  