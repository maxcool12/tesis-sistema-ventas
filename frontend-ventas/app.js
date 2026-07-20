const API = "http://localhost:3001";

// 🔐 PROTEGER INDEX
if (window.location.pathname.includes("index.html")) {
  const user = localStorage.getItem("usuario");
  if (!user) window.location.href = "login.html";
}

// 👤 USUARIO
const user = JSON.parse(localStorage.getItem("usuario"));
if (user) {
  const el = document.getElementById("usuarioLogueado");
  if (el) el.textContent = `${user.email} (${user.rol})`;
}

// 🔐 LOGIN
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/usuarios/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    alert("Credenciales incorrectas");
    return;
  }

  const data = await res.json();
  localStorage.setItem("usuario", JSON.stringify(data));
  window.location.href = "index.html";
}

// 🚪 LOGOUT
function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

// 🔥 ROLES
function esAdmin() {
  return user?.rol === "admin";
}

// 📌 NAVEGACIÓN
function mostrarSeccion(seccion) {

  // Ocultar todas las secciones
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("productos").style.display = "none";
  document.getElementById("ventas").style.display = "none";
  document.getElementById("historial").style.display = "none";

  // Mostrar la sección elegida
  document.getElementById(seccion).style.display = "block";

  // Quitar el estado activo de todos los botones
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("activo");
  });

  // Activar el botón correspondiente
  switch (seccion) {

    case "dashboard":
      document.getElementById("btnDashboard").classList.add("activo");
      break;

    case "productos":
      document.getElementById("btnProductos").classList.add("activo");
      break;

    case "ventas":
      document.getElementById("btnVentas").classList.add("activo");
      break;

    case "historial":
      document.getElementById("btnHistorial").classList.add("activo");
      break;

  }

}

// 📦 PRODUCTOS
async function guardarProducto() {
  if (!esAdmin()) {
    alert("No autorizado");
    return;
  }

  const nombre = document.getElementById("nombreProducto").value;
  const precio = document.getElementById("precioProducto").value;
  const stock = document.getElementById("stockProducto").value;
  const categoriaId = document.getElementById("categoriaProducto").value;

  await fetch(`${API}/productos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre,
      precio,
      stock,
      categoria: { id: Number(categoriaId) }
    })
  });

  alertaExito(
    "Producto registrado",
    "El producto fue creado correctamente."
  );

  document.getElementById("nombreProducto").value = "";
  document.getElementById("precioProducto").value = "";
  document.getElementById("stockProducto").value = "";

  cargarProductos();
}

async function cargarProductos() {

  const res = await fetch(`${API}/productos`);
  const productos = await res.json();

  const textoBusqueda =
    document.getElementById("buscarProducto")?.value
      ?.toLowerCase() || "";

  const categoriaSeleccionada =
    document.getElementById("filtroCategoria")?.value || "";

  const contenedor =
    document.getElementById("listaProductos");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  productos
    .filter(producto => {

      const coincideNombre =
        producto.nombre
          .toLowerCase()
          .includes(textoBusqueda);

      const coincideCategoria =
        categoriaSeleccionada === "" ||
        producto.categoria?.id == categoriaSeleccionada;

      return coincideNombre && coincideCategoria;

    })
    .forEach(producto => {

      let colorStock = "success";
      let estadoStock = "Stock Alto";

      if (producto.stock <= 5) {
        colorStock = "warning";
        estadoStock = "Stock Medio";
      }

      if (producto.stock <= 2) {
        colorStock = "danger";
        estadoStock = "Stock Bajo";
      }

      let botonesAdmin = "";

      if (esAdmin()) {

        botonesAdmin = `

          <div class="d-flex gap-2 mt-3">

            <button
              class="btn btn-warning btn-sm flex-fill"
              onclick="editarProducto(
                ${producto.id},
                '${producto.nombre}',
                ${producto.precio},
                ${producto.stock},
                ${producto.categoria?.id || 0}
              )">

              ✏️ Editar

            </button>

            <button
              class="btn btn-danger btn-sm flex-fill"
              onclick="eliminarProducto(${producto.id})">

              🗑 Desactivar

            </button>

          </div>

        `;

      }

      contenedor.innerHTML += `

        <div class="col-lg-4 col-md-6 mb-4">

          <div class="card border-0 shadow h-100 card-producto">

            <div class="card-body">

              <div class="d-flex justify-content-between align-items-center">

                <h5 class="fw-bold mb-0">
                  🥤 ${producto.nombre}
                </h5>

                <span class="badge bg-primary">
                  ID ${producto.id}
                </span>

              </div>

              <hr>

              <p class="mb-2">
                <strong>💲 Precio:</strong>
                $${producto.precio}
              </p>

              <p class="mb-2">
                <strong>📦 Stock:</strong>
                ${producto.stock}
              </p>

              <p class="mb-3">
                <strong>🏷 Categoría:</strong>
                ${producto.categoria?.nombre || "Sin categoría"}
              </p>
              <span class="badge bg-${colorStock}">
                ${estadoStock}
              </span>

              ${botonesAdmin}

            </div>

          </div>

        </div>

      `;

    });

}
async function eliminarProducto(id) {

  const ok = await confirmar(
    "¿Desactivar producto?",
    "El producto dejará de estar disponible para vender."
  );

  if (!ok) return;

  await fetch(`${API}/productos/${id}`, {
    method: "DELETE"
  });

  alertaExito("Producto desactivado");

  cargarProductos();

}
async function editarProducto(
  id,
  nombre,
  precio,
  stock,
  categoriaId
) {

  document.getElementById("editarId").value = id;
  document.getElementById("editarNombre").value = nombre;
  document.getElementById("editarPrecio").value = precio;
  document.getElementById("editarStock").value = stock;

  const res = await fetch(`${API}/categorias`);
  const categorias = await res.json();

  const select =
    document.getElementById("editarCategoria");

  select.innerHTML = "";

  categorias.forEach(c => {

    select.innerHTML += `
      <option
        value="${c.id}"
        ${c.id === categoriaId ? "selected" : ""}>
        ${c.nombre}
      </option>
    `;
  });

  const modal = new bootstrap.Modal(
    document.getElementById(
      "modalEditarProducto"
    )
  );

  modal.show();
}
async function guardarEdicionProducto() {

  const id =
    document.getElementById("editarId").value;

  const nombre =
    document.getElementById("editarNombre").value;

  const precio =
    document.getElementById("editarPrecio").value;

  const stock =
    document.getElementById("editarStock").value;

  const categoriaId =
    document.getElementById("editarCategoria").value;

  await fetch(
    `${API}/productos/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nombre,
        precio,
        stock,
        categoria: {
          id: Number(categoriaId)
        }
      })
    }
  );
  alertaExito(
    "Producto actualizado",
    "Los cambios fueron guardados correctamente."
  );

  bootstrap.Modal
    .getInstance(
      document.getElementById(
        "modalEditarProducto"
      )
    )
    .hide();

  cargarProductos();
}
async function mostrarInactivos() {

  const res = await fetch(`${API}/productos/todos`);

  const productos = await res.json();

  const inactivos =
    productos.filter(p => !p.activo);

  const contenedor =
    document.getElementById("productosInactivos");

  contenedor.innerHTML = "";

  if (inactivos.length === 0) {

    contenedor.innerHTML = `
            <div class="alert alert-info">

                No existen productos inactivos.

            </div>
        `;

  } else {

    inactivos.forEach(prod => {

      contenedor.innerHTML += `

                <div class="col-md-4 mb-3">

                    <div class="card border-danger shadow-sm">

                        <div class="card-body">

                            <h5>${prod.nombre}</h5>

                            <p>
                                Precio:
                                $${prod.precio}
                            </p>

                            <span
                                class="badge bg-danger">

                                INACTIVO

                            </span>

                            <hr>

                            <button
                                class="btn btn-success w-100"
                                onclick="reactivarProducto(${prod.id})">

                                Reactivar

                            </button>

                        </div>

                    </div>

                </div>

            `;

    });

  }

  const modal =
    new bootstrap.Modal(
      document.getElementById("modalInactivos")
    );

  modal.show();

}
async function reactivarProducto(id) {

  const ok = await confirmar(
    "¿Reactivar producto?",
    "El producto volverá a estar disponible para la venta."
  );

  if (!ok) return;

  await fetch(`${API}/productos/${id}/reactivar`, {
    method: "PUT"
  });

  alertaExito(
    "Producto reactivado",
    "El producto ya está disponible nuevamente."
  );

  cargarProductos();
  mostrarInactivos();

}


async function cargarCategorias() {
  const res = await fetch(`${API}/categorias`);
  const data = await res.json();


  const select = document.getElementById("categoriaProducto");

  if (select) {
    select.innerHTML = "";

    data.forEach(c => {
      select.innerHTML += `
        <option value="${c.id}">
          ${c.nombre}
        </option>
      `;
    });
  }

  // SELECT DEL FILTRO
  const filtro = document.getElementById("filtroCategoria");

  if (filtro) {
    filtro.innerHTML =
      `<option value="">Todas las categorías</option>`;

    data.forEach(c => {
      filtro.innerHTML += `
        <option value="${c.id}">
          ${c.nombre}
        </option>
      `;
    });
  }
}
// 🛒 CARRITO
let carrito = [];

function agregarAlCarrito() {

  const productoId =
    Number(document.getElementById("productoVenta").value);

  const cantidad =
    Number(document.getElementById("cantidadVenta").value);

  if (cantidad <= 0) {

    alertaError("Ingrese una cantidad válida.");

    return;
  }

  const producto = productos.find(p => p.id == productoId);

  if (!producto) return;

  carrito.push({

    productoId: producto.id,
    nombre: producto.nombre,
    precio: Number(producto.precio),
    cantidad

  });

  actualizarCarrito();

}
function actualizarCarrito() {

  const tabla =
    document.getElementById("carrito");

  tabla.innerHTML = "";

  let total = 0;

  carrito.forEach((item, index) => {

    const subtotal =
      item.precio * item.cantidad;

    total += subtotal;

    tabla.innerHTML += `

      <tr>

        <td>${item.nombre}</td>

        <td>${item.cantidad}</td>

        <td>$${item.precio}</td>

        <td class="fw-bold text-success">

          $${subtotal}

        </td>

        <td>

          <button
            class="btn btn-danger btn-sm"
            onclick="eliminarDelCarrito(${index})">

            <i class="bi bi-trash"></i>

          </button>

        </td>

      </tr>

    `;

  });

  document.getElementById("totalCarrito").innerText =
    "$" + total;

}
function eliminarDelCarrito(indice) {

  carrito.splice(indice, 1);

  actualizarCarrito();

}

// 💸 VENTA
async function realizarVenta() {

  if (carrito.length === 0) {

    alertaError(
      "Debe agregar al menos un producto al carrito."
    );

    return;
  }

  await fetch(`${API}/ventas`, {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      productos: carrito
    })

  });

  alertaExito(
    "Venta registrada",
    "La venta se realizó correctamente."
  );

  // Vaciar carrito
  carrito = [];

  actualizarCarrito();

  // Limpiar formulario
  document.getElementById("cantidadVenta").value = 1;
  document.getElementById("productoVenta").selectedIndex = 0;

  // Actualizar información
  cargarDashboard();
  cargarProductos();
  cargarHistorial();

}
async function cargarHistorial() {

  const res = await fetch(
    `${API}/ventas`
  );

  const ventas = await res.json();

  const tabla =
    document.getElementById(
      "tablaHistorial"
    );

  tabla.innerHTML = "";

  ventas.forEach(venta => {

    venta.detalles.forEach(detalle => {

      tabla.innerHTML += `
        <tr>

          <td>
            ${new Date(
        venta.fecha
      ).toLocaleString()}
          </td>

          <td>
            ${detalle.producto.nombre}
          </td>

          <td>
            ${detalle.cantidad}
          </td>

          <td>
            $${detalle.total}
          </td>

        </tr>
      `;
    });
  });
}

// 📦 PRODUCTOS PARA VENTA
async function cargarProductosVenta() {
  const res = await fetch(`${API}/productos`);
  const data = await res.json();

  const select = document.getElementById("productoVenta");
  select.innerHTML = "";

  data.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.nombre} ($${p.precio})</option>`;
  });
}

// 📊 GRAFICO
let grafico;

async function cargarDashboard() {
  const res = await fetch(`${API}/ventas/dashboard`);
  const data = await res.json();

  console.log("DASHBOARD DATA:", data); // 🔥 DEBUG

  document.getElementById("totalIngresos").textContent =
    "$" + (data.totalIngresos || 0);

  document.getElementById("totalProductos").textContent =
    data.totalProductos || 0;

  document.getElementById("cantidadVentas").textContent =
    data.cantidadVentas || 0;

  document.getElementById("productoMasVendido").textContent =
    data.productoMasVendido || "-";

  document.getElementById("productosActivos").textContent =
    data.productosActivos || 0;

  document.getElementById("cantidadProductosInactivos").textContent =
    data.productosInactivos;

  // 🧠 VALIDAR SI HAY DATOS
  if (!data.ventasPorCategoria || data.ventasPorCategoria.length === 0) {
    console.warn("No hay datos para el gráfico");
    return;
  }

  const labels = data.ventasPorCategoria.map(c => c.categoria);
  const valores = data.ventasPorCategoria.map(c => Number(c.total));

  const canvas = document.getElementById("graficoCategorias");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Ventas ($)",
        data: valores
      }]
    }
  });

  // 📋 RESUMEN
  const resumen = document.getElementById("resumenCategorias");
  if (resumen) {
    resumen.innerHTML = "";

    data.ventasPorCategoria.forEach(c => {
      resumen.innerHTML += `<p>${c.categoria}: $${c.total}</p>`;
    });
  }
}

window.onload = () => {
  cargarCategorias();
  cargarDashboard();

  if (!esAdmin()) {
    const btn = document.getElementById("btnGuardarProducto");
    if (btn) btn.style.display = "none";
  }
  function alertaExito(titulo, texto = "") {
    Swal.fire({
      icon: "success",
      title: titulo,
      text: texto,
      confirmButtonColor: "#198754"
    });
  }

  function alertaError(texto) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: texto,
      confirmButtonColor: "#dc3545"
    });
  }

  function alertaInfo(texto) {
    Swal.fire({
      icon: "info",
      title: "Información",
      text: texto
    });
  }
  async function confirmar(titulo, texto = "") {

    const resultado = await Swal.fire({
      title: titulo,
      text: texto,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#198754",
      cancelButtonColor: "#dc3545"
    });

    return resultado.isConfirmed;
  }
};