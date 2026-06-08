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

  ["dashboard", "productos", "ventas", "historial"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const activa = document.getElementById(seccion);

  if (activa) {
    activa.style.display = "block";
  }

  if (seccion === "productos") {
    cargarCategorias();
    cargarProductos();
  }

  if (seccion === "ventas") {
    cargarProductosVenta();
  }

  if (seccion === "dashboard") {
    cargarDashboard();
  }

  if (seccion === "historial") {
    cargarHistorial();
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

  alert("Producto guardado");

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

  const contenedor =
    document.getElementById("listaProductos");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  productos
  .filter(producto =>
    producto.nombre
      .toLowerCase()
      .includes(textoBusqueda)
  )
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
       <button
  class="btn btn-warning btn-sm me-2"
  onclick="editarProducto(
    ${producto.id},
    '${producto.nombre}',
    ${producto.precio},
    ${producto.stock},
    ${producto.categoria?.id || 0}
  )">
  Editar
</button>

<button
  class="btn btn-danger btn-sm"
  onclick="eliminarProducto(${producto.id})">
  Desactivar
</button>
      `;
    }



    contenedor.innerHTML += `
      <div class="col-md-4 mb-3">
        <div class="card shadow-sm h-100">
          <div class="card-body">

            <h5 class="card-title">
              ${producto.nombre}
            </h5>

            <p>
              <strong>Precio:</strong>
              $${producto.precio}
            </p>

            <p>
              <strong>Categoría:</strong>
              ${producto.categoria?.nombre || "Sin categoría"}
            </p>

            <div class="mt-3">
              ${botonesAdmin}
            </div>

            <div class="mt-2">
              <span class="badge bg-${colorStock}">
                Stock: ${producto.stock}
              </span>

              <div class="mt-2">
                <strong>${estadoStock}</strong>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  });

}
async function eliminarProducto(id) {

  if (!esAdmin()) {
    alert("No autorizado");
    return;
  }

  const confirmar = confirm(
    "¿Desea eliminar este producto?"
  );

  if (!confirmar) return;

  await fetch(`${API}/productos/${id}`, {
    method: "DELETE"
  });

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

  const res = await fetch(
    `${API}/productos/todos`
  );

  const productos = await res.json();

  const inactivos =
    productos.filter(
      p => !p.activo
    );

  const contenedor =
    document.getElementById(
      "productosInactivos"
    );

  contenedor.innerHTML = "";

  inactivos.forEach(prod => {

    contenedor.innerHTML += `
      <div class="col-md-4 mb-3">
        <div class="card border-secondary">

          <div class="card-body">

            <h5>${prod.nombre}</h5>

            <p>
              Precio:
              $${prod.precio}
            </p>

            <button
              class="btn btn-success"
              onclick="reactivarProducto(${prod.id})">

              Reactivar

            </button>

          </div>

        </div>
      </div>
    `;
  });
}
async function reactivarProducto(id) {

  await fetch(
    `${API}/productos/${id}/reactivar`,
    {
      method: "PUT"
    }
  );

  cargarProductos();

  mostrarInactivos();
}

// 📂 CATEGORÍAS
async function cargarCategorias() {
  const res = await fetch(`${API}/categorias`);
  const data = await res.json();

  const select = document.getElementById("categoriaProducto");
  if (!select) return;

  select.innerHTML = "";

  data.forEach(c => {
    select.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
  });
}

// 🛒 CARRITO
let carrito = [];

function agregarAlCarrito() {
  const select = document.getElementById("productoVenta");

  const productoId = select.value;
  const productoNombre = select.options[select.selectedIndex].text;
  const cantidad = document.getElementById("cantidadVenta").value;

  carrito.push({
    productoId: Number(productoId),
    nombre: productoNombre,
    cantidad: Number(cantidad)
  });

  renderCarrito();
}

function renderCarrito() {
  const lista = document.getElementById("carrito");
  lista.innerHTML = "";

  carrito.forEach(item => {
    lista.innerHTML += `
      <li class="list-group-item">
        ${item.nombre} - Cantidad: ${item.cantidad}
      </li>`;
  });
}

// 💸 VENTA
async function realizarVenta() {
  await fetch(`${API}/ventas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productos: carrito })
  });

  alert("Venta realizada");

  carrito = [];
  renderCarrito();

  // limpiar inputs
  document.getElementById("cantidadVenta").value = "";
  document.getElementById("productoVenta").selectedIndex = 0;

  cargarDashboard();
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

// 🚀 INIT
window.onload = () => {
  cargarDashboard();

  if (!esAdmin()) {
    const btn = document.getElementById("btnGuardarProducto");
    if (btn) btn.style.display = "none";
  }
};