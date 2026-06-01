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
  ["dashboard", "productos", "ventas"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const activa = document.getElementById(seccion);
  if (activa) activa.style.display = "block";

  if (seccion === "productos") cargarCategorias();
  if (seccion === "ventas") cargarProductosVenta();
  if (seccion === "dashboard") cargarDashboard();
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