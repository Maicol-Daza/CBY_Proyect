document.addEventListener("DOMContentLoaded", () => {
  const contenedorPrendas = document.getElementById("contenedor-prendas");
  const botonAgregarPrenda = document.getElementById("boton-agregar-prenda");
  const templatePrenda = document.getElementById("template-prenda");
  const templateAjuste = document.getElementById("template-ajuste");
  const campoTotal = document.getElementById("campo-total");
  const campoAbono = document.getElementById("campo-abono");
  const campoSaldo = document.getElementById("campo-saldo");

  botonAgregarPrenda.addEventListener("click", () => {
    const prendaClon = templatePrenda.content.cloneNode(true);
    const prendaDiv = prendaClon.querySelector(".prenda-card");
    const ajustesContenedor = prendaDiv.querySelector(".ajustes-contenedor");
    const botonAgregarAjuste = prendaDiv.querySelector(".boton-agregar-ajuste");
    const botonEliminarPrenda = prendaDiv.querySelector(".boton-eliminar-prenda");

    // Agregar ajuste
    botonAgregarAjuste.addEventListener("click", () => {
      const ajusteClon = templateAjuste.content.cloneNode(true);
      const inputCosto = ajusteClon.querySelector(".costo-ajuste");
      const botonEliminarAjuste = ajusteClon.querySelector(".btn-eliminar-ajuste");

      // Eliminar ajuste
      botonEliminarAjuste.addEventListener("click", (e) => {
        e.target.closest(".ajuste").remove();
        actualizarTotalYSaldo();
      });

      // Actualizar total al editar costo
      inputCosto.addEventListener("input", actualizarTotalYSaldo);

      ajustesContenedor.appendChild(ajusteClon);
      actualizarTotalYSaldo();
    });

    // Eliminar prenda
    botonEliminarPrenda.addEventListener("click", () => {
      prendaDiv.remove();
      actualizarTotalYSaldo();
    });

    contenedorPrendas.appendChild(prendaClon);
  });

  // Recalcular saldo cuando el abono cambia
  campoAbono.addEventListener("input", actualizarSaldo);

  function actualizarTotalYSaldo() {
    let total = 0;

    const todosLosCostos = document.querySelectorAll(".costo-ajuste");
    todosLosCostos.forEach(input => {
      const valor = parseFloat(input.value);
      if (!isNaN(valor)) {
        total += valor;
      }
    });

    campoTotal.value = total.toFixed(2);
    actualizarSaldo();
  }

  function actualizarSaldo() {
    const total = parseFloat(campoTotal.value) || 0;
    const abono = parseFloat(campoAbono.value) || 0;
    const saldo = total - abono;
    campoSaldo.value = saldo.toFixed(2);
  }
});

