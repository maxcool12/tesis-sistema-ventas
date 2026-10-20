const API = "http://localhost:3001";

if (window.location.pathname.includes("index.html")) {
  const usuarioGuardado = localStorage.getItem("usuario");
  if (!usuarioGuardado) {
    window.location.href = "login.html";
  }
}

const user = JSON.parse(localStorage.getItem("usuario"));

if (user) {
  const el = document.getElementById("usuarioLogueado");
  if (el) el.textContent = `${user.email} (${user.rol})`;
}

let carrito = [];
let productos = [];
let clientes = [];
let categorias = [];
let metodosPago = [];
let empleados = [];
let paginaEmpleados = 1;
const limiteEmpleados = 15;
let graficoCategorias = null;
let graficoMetodosPago = null;
let paginaHistorial = 1;
const limiteHistorial = 15;
let paginaProductos = 1;
const limiteProductos = 15;
let proveedores = [];
let paginaProveedores = 1;
const limiteProveedores = 10;
let movimientosStock = [];
let paginaMovimientosStock = 1;
const limiteMovimientosStock = 15;

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

function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
}

function esAdmin() {
  return user?.rol === "admin";
}
async function cargarOpcionesProducto() {
  const [empleadosRes, proveedoresRes] = await Promise.all([
    fetch(`${API}/empleados?page=1&limit=100`),
    fetch(`${API}/proveedores?page=1&limit=100`)
  ]);

  if (!empleadosRes.ok || !proveedoresRes.ok) {
    throw new Error("No se pudieron cargar empleados y proveedores.");
  }

  const empleadosResultado = await empleadosRes.json();
  const proveedoresResultado = await proveedoresRes.json();

  const empleadosLista = empleadosResultado.data || [];
  const proveedoresLista = proveedoresResultado.data || [];

  const selects = [
    ["empleadoCargaProducto", empleadosLista, "Seleccionar empleado", e => `${e.nombre} ${e.apellido}`],
    ["editarEmpleadoProducto", empleadosLista, "Seleccionar empleado", e => `${e.nombre} ${e.apellido}`],
    ["proveedorProducto", proveedoresLista, "Seleccionar proveedor", p => p.nombre],
    ["editarProveedorProducto", proveedoresLista, "Seleccionar proveedor", p => p.nombre],
    ["proveedorMovimientoStock", proveedoresLista, "Seleccionar proveedor", p => p.nombre]
  ];

  selects.forEach(([id, lista, textoInicial, obtenerTexto]) => {
    const select = document.getElementById(id);
    if (!select) return;

    const valorActual = select.value;
    select.innerHTML = `<option value="">${textoInicial}</option>`;

    lista.forEach(item => {
      select.innerHTML += `<option value="${item.id}">${escapeHtml(obtenerTexto(item))}</option>`;
    });

    if (valorActual) select.value = valorActual;
  });
}

async function abrirModalProducto() {
  if (!esAdmin()) {
    return alertaError("No tiene permisos para realizar esta acción.");
  }

  try {
    await cargarCategorias();
    await cargarOpcionesProducto();

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("modalProducto")
    ).show();
  } catch (error) {
    alertaError(error.message);
  }
}

async function cargarEmpleadosVenta() {
  const res = await fetch(`${API}/empleados?page=1&limit=100`);

  if (!res.ok) {
    throw new Error("No se pudieron cargar los empleados.");
  }

  const resultado = await res.json();
  const lista = resultado.data || [];
  const select = document.getElementById("empleadoVenta");

  if (!select) return;

  select.innerHTML = `<option value="">Seleccionar empleado</option>`;

  lista.forEach(empleado => {
    select.innerHTML += `
      <option value="${empleado.id}">
        ${escapeHtml(`${empleado.nombre} ${empleado.apellido}`)}
      </option>
    `;
  });
}

function mostrarSeccion(seccion) {
  ["dashboard", "productos", "categorias", "metodosPago", "clientes", "ventas", "historial", "empleados", "proveedores", "movimientosStock", "devoluciones"].forEach(id => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.style.display = "none";
    if (seccion === "ventas") {
      cargarClientesVenta();
      cargarProductosVenta();
      cargarMetodosPagoVenta();
      cargarEmpleadosVenta();
    }
  });

  const actual = document.getElementById(seccion);
  if (actual) actual.style.display = "block";

  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("activo"));

  const botones = {
    dashboard: "btnDashboard",
    productos: "btnProductos",
    categorias: "btnCategorias",
    metodosPago: "btnMetodosPago",
    clientes: "btnClientes",
    ventas: "btnVentas",
    historial: "btnHistorial",
    proveedores: "btnProveedores",
    movimientosStock: "btnMovimientosStock",
    devoluciones: "btnDevoluciones"
  };

  const boton = document.getElementById(botones[seccion]);
  if (boton) boton.classList.add("activo");

  if (seccion === "dashboard") cargarDashboard();
  if (seccion === "productos") cargarProductos();
  if (seccion === "categorias") cargarCategorias();
  if (seccion === "metodosPago") cargarMetodosPago();
  if (seccion === "clientes") cargarClientes();

  if (seccion === "ventas") {
    cargarClientesVenta();
    cargarProductosVenta();
    cargarMetodosPagoVenta();
  }

  if (seccion === "historial") {
    paginaHistorial = 1;
    cargarHistorial();
  }
  if (seccion === "empleados") {
    cargarEmpleados();
  }
  if (seccion === "proveedores") {
    paginaProveedores = 1;
    cargarProveedores();
  }
  if (seccion === "movimientosStock") {
    paginaMovimientosStock = 1;
    cargarMovimientosStock();
  }
  if (seccion === "devoluciones") {
    cargarDevoluciones();
  }
}

async function guardarProducto() {
  if (!esAdmin()) {
    return alertaError("No tiene permisos para realizar esta acción.");
  }

  const nombre = document.getElementById("nombreProducto").value.trim();
  const descripcion = document.getElementById("descripcionProducto").value.trim();
  const precio = Number(document.getElementById("precioProducto").value);
  const stock = Number(document.getElementById("stockProducto").value);
  const categoriaId = Number(document.getElementById("categoriaProducto").value);
  const proveedorId = Number(document.getElementById("proveedorProducto").value);
  const empleadoCargaId = Number(document.getElementById("empleadoCargaProducto").value);

  if (!nombre || !categoriaId || !proveedorId || !empleadoCargaId ||
    Number.isNaN(precio) || precio < 0 ||
    Number.isNaN(stock) || stock < 0) {
    return alertaError("Complete correctamente todos los campos obligatorios.");
  }

  try {
    const res = await fetch(`${API}/productos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        descripcion,
        costo: 0,
        precio,
        stock,
        categoriaId,
        proveedorId,
        empleadoCargaId
      })
    });

    const resultado = await res.json();

    if (!res.ok) {
      throw new Error(
        Array.isArray(resultado.message)
          ? resultado.message.join(" ")
          : resultado.message || "No se pudo crear el producto."
      );
    }

    alertaExito("Producto registrado", "El producto fue creado correctamente.");

    [
      "nombreProducto",
      "descripcionProducto",
      "precioProducto",
      "stockProducto",
      "categoriaProducto",
      "proveedorProducto",
      "empleadoCargaProducto"
    ].forEach(id => {
      const elemento = document.getElementById(id);
      if (elemento) elemento.value = "";
    });

    bootstrap.Modal.getInstance(
      document.getElementById("modalProducto")
    )?.hide();

    await cargarProductos();
    await cargarProductosVenta();
    await cargarMovimientosStock();
    cargarDashboard();
  } catch (error) {
    alertaError(error.message || "Error al registrar el producto.");
  }
}

async function cargarProductos() {
  try {
    const res = await fetch(`${API}/productos?page=1&limit=100`);

    if (!res.ok) {
      throw new Error("No se pudieron cargar los productos.");
    }

    const resultado = await res.json();

    productos = Array.isArray(resultado)
      ? resultado
      : resultado.data || [];

    const texto =
      document.getElementById("buscarProducto")?.value
        ?.toLowerCase()
        .trim() || "";

    const categoriaId =
      document.getElementById("filtroCategoria")?.value || "";

    const contenedor =
      document.getElementById("listaProductos");

    if (!contenedor) return;

    const filtrados = productos.filter(producto => {
      const contenido = `
        ${producto.nombre || ""}
        ${producto.descripcion || ""}
        ${producto.detalle || ""}
      `.toLowerCase();

      const coincideTexto =
        contenido.includes(texto);

      const coincideCategoria =
        !categoriaId ||
        producto.categoria?.id == categoriaId;

      return coincideTexto && coincideCategoria;
    });

    const totalPaginas =
      Math.max(
        1,
        Math.ceil(
          filtrados.length /
          limiteProductos
        )
      );

    if (paginaProductos > totalPaginas) {
      paginaProductos = totalPaginas;
    }

    const inicio =
      (paginaProductos - 1) *
      limiteProductos;

    const productosPagina =
      filtrados.slice(
        inicio,
        inicio + limiteProductos
      );

    contenedor.innerHTML = "";

    if (!filtrados.length) {
      contenedor.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info">
            No se encontraron productos.
          </div>
        </div>
      `;

      renderPaginacionProductos(1);
      return;
    }

    productosPagina.forEach(producto => {
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
              onclick="editarProducto(${producto.id})">
              <i class="bi bi-pencil-square me-1"></i>Editar
            </button>

            <button
              class="btn btn-danger btn-sm flex-fill"
              onclick="eliminarProducto(${producto.id})">
              <i class="bi bi-trash me-1"></i>Desactivar
            </button>
          </div>
        `;
      }

      contenedor.innerHTML += `
        <div class="col-lg-4 col-md-6">
          <div class="card border-0 shadow h-100">
            <div class="card-body">

              <div class="d-flex justify-content-between align-items-center">
                <h5 class="fw-bold mb-0">
                  <i class="bi bi-box-seam me-1"></i>
                  ${escapeHtml(producto.nombre)}
                </h5>

                <span class="badge bg-primary">
                  ID ${producto.id}
                </span>
              </div>

              <p class="text-muted mt-2 mb-2">
                ${escapeHtml(
        producto.descripcion ||
        "Sin descripción"
      )}
              </p>

              <p class="mb-1">
                <strong>Precio:</strong>
                $${Number(producto.precio).toLocaleString("es-AR")}
              </p>

              <p class="mb-1">
                <strong>Stock:</strong>
                ${producto.stock}
              </p>

              <p class="mb-0">
                <strong>Categoría:</strong>
                ${escapeHtml(
        producto.categoria?.nombre ||
        "Sin categoría"
      )}
              </p>

              <div class="mt-3">
                <span class="badge bg-${colorStock}">
                  ${estadoStock}
                </span>
              </div>

              ${botonesAdmin}

            </div>
          </div>
        </div>
      `;
    });

    renderPaginacionProductos(totalPaginas);

  } catch (error) {
    alertaError(
      error.message ||
      "Error al cargar productos."
    );
  }
}

function renderPaginacionProductos(totalPaginas) {
  const contenedor =
    document.getElementById(
      "paginacionProductos"
    );

  if (!contenedor) return;

  if (totalPaginas <= 1) {
    contenedor.innerHTML = "";
    return;
  }

  contenedor.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mt-4">

      <button
        class="btn btn-outline-secondary"
        ${paginaProductos <= 1 ? "disabled" : ""}
        onclick="cambiarPaginaProductos(${paginaProductos - 1})">

        <i class="bi bi-chevron-left me-1"></i>
        Anterior

      </button>

      <span class="fw-bold">
        Página ${paginaProductos}
        de ${totalPaginas}
      </span>

      <button
        class="btn btn-outline-secondary"
        ${paginaProductos >= totalPaginas ? "disabled" : ""}
        onclick="cambiarPaginaProductos(${paginaProductos + 1})">

        Siguiente
        <i class="bi bi-chevron-right ms-1"></i>

      </button>

    </div>
  `;
}

function cambiarPaginaProductos(pagina) {
  if (pagina < 1) return;

  paginaProductos = pagina;

  cargarProductos();
}

function actualizarSelectProductosVenta() {
  renderProductosVenta();
}

async function editarProducto(id) {
  try {
    const producto = productos.find(p => p.id == id);

    if (!producto) {
      throw new Error("No se pudo obtener el producto.");
    }

    await cargarCategorias();
    await cargarOpcionesProducto();

    document.getElementById("editarId").value = producto.id;
    document.getElementById("editarNombre").value = producto.nombre || "";
    document.getElementById("editarDescripcion").value = producto.descripcion || "";
    document.getElementById("editarPrecio").value = producto.precio ?? 0;
    document.getElementById("editarStock").value = producto.stock ?? 0;
    document.getElementById("editarCategoria").value = producto.categoria?.id || "";
    document.getElementById("editarProveedorProducto").value = producto.proveedor?.id || "";
    document.getElementById("editarEmpleadoProducto").value = "";

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("modalEditarProducto")
    ).show();
  } catch (error) {
    alertaError(error.message || "Error al editar producto.");
  }
}

async function guardarEdicionProducto() {
  const id = Number(document.getElementById("editarId").value);
  const nombre = document.getElementById("editarNombre").value.trim();
  const descripcion = document.getElementById("editarDescripcion").value.trim();
  const precio = Number(document.getElementById("editarPrecio").value);
  const stock = Number(document.getElementById("editarStock").value);
  const categoriaId = Number(document.getElementById("editarCategoria").value);
  const proveedorId = Number(document.getElementById("editarProveedorProducto").value);
  const empleadoId = Number(document.getElementById("editarEmpleadoProducto").value);

  if (!id || !nombre || !categoriaId || !proveedorId ||
    Number.isNaN(precio) || precio < 0 ||
    Number.isNaN(stock) || stock < 0) {
    return alertaError("Complete correctamente todos los campos obligatorios.");
  }

  if (!empleadoId) {
    return alertaError("Seleccione el empleado responsable del ajuste de stock.");
  }

  try {
    const res = await fetch(`${API}/productos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        descripcion,
        costo: 0,
        precio,
        stock,
        categoriaId,
        proveedorId,
        empleadoId
      })
    });

    const resultado = await res.json();

    if (!res.ok) {
      throw new Error(
        Array.isArray(resultado.message)
          ? resultado.message.join(" ")
          : resultado.message || "No se pudo actualizar el producto."
      );
    }

    alertaExito("Producto actualizado", "Los cambios fueron guardados correctamente.");

    bootstrap.Modal.getInstance(
      document.getElementById("modalEditarProducto")
    )?.hide();

    await cargarProductos();
    await cargarProductosVenta();
    await cargarMovimientosStock();
    cargarDashboard();
  } catch (error) {
    alertaError(error.message || "Error al actualizar el producto.");
  }
}

async function eliminarProducto(id) {
  const ok = await confirmar(
    "¿Desactivar producto?",
    "El producto dejará de estar disponible para vender."
  );

  if (!ok) return;

  try {
    const res = await fetch(
      `${API}/productos/${id}`,
      {
        method: "DELETE"
      }
    );

    if (!res.ok) {
      throw new Error(
        "No se pudo desactivar el producto."
      );
    }

    alertaExito("Producto desactivado");

    await cargarProductos();
    await cargarProductosVenta();
    cargarDashboard();
  } catch (error) {
    alertaError(error.message);
  }
}

async function mostrarInactivos() {
  try {
    const res = await fetch(
      `${API}/productos/todos`
    );

    if (!res.ok) {
      throw new Error(
        "No se pudieron cargar los productos."
      );
    }

    const lista = await res.json();

    const inactivos =
      lista.filter(p => !p.activo);

    const contenedor =
      document.getElementById(
        "productosInactivos"
      );

    contenedor.innerHTML = "";

    if (!inactivos.length) {
      contenedor.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info">
            No existen productos inactivos.
          </div>
        </div>
      `;
    } else {
      inactivos.forEach(producto => {
        contenedor.innerHTML += `
          <div class="col-md-4 mb-3">
            <div class="card border-danger shadow-sm">
              <div class="card-body">

                <h5>
                  ${escapeHtml(producto.nombre)}
                </h5>

                <p>
                  ${escapeHtml(
          producto.descripcion ||
          "Sin descripción"
        )}
                </p>

                <p>
                  Precio:
                  $${Number(
          producto.precio || 0
        ).toLocaleString("es-AR")}
                </p>

                <span class="badge bg-danger">
                  INACTIVO
                </span>

                <hr>

                <button
                  class="btn btn-success w-100"
                  onclick="reactivarProducto(${producto.id})">
                  <i class="bi bi-arrow-counterclockwise me-1"></i>
                  Reactivar
                </button>

              </div>
            </div>
          </div>
        `;
      });
    }

    new bootstrap.Modal(
      document.getElementById("modalInactivos")
    ).show();
  } catch (error) {
    alertaError(
      error.message ||
      "No se pudieron cargar los productos inactivos."
    );
  }
}

async function reactivarProducto(id) {
  const ok = await confirmar(
    "¿Reactivar producto?",
    "El producto volverá a estar disponible para la venta."
  );

  if (!ok) return;

  try {
    const res = await fetch(
      `${API}/productos/${id}/reactivar`,
      {
        method: "PUT"
      }
    );

    if (!res.ok) {
      throw new Error(
        "No se pudo reactivar el producto."
      );
    }

    alertaExito("Producto reactivado");

    await cargarProductos();
    await cargarProductosVenta();
    cargarDashboard();

    const modal =
      bootstrap.Modal.getInstance(
        document.getElementById("modalInactivos")
      );

    if (modal) modal.hide();
  } catch (error) {
    alertaError(error.message);
  }
}

async function cargarCategorias() {
  try {
    const res = await fetch(
      `${API}/categorias`
    );

    if (!res.ok) {
      throw new Error(
        "No se pudieron cargar las categorías."
      );
    }

    categorias = await res.json();

    cargarSelectCategorias();
    renderCategorias();
  } catch (error) {
    alertaError(error.message);
  }
}

function cargarSelectCategorias() {
  const selects = [
    "categoriaProducto",
    "editarCategoria",
    "filtroCategoria"
  ];

  selects.forEach(id => {
    const select =
      document.getElementById(id);

    if (!select) return;

    const valor = select.value;

    const inicio =
      id === "filtroCategoria"
        ? "Todas las categorías"
        : "Seleccionar categoría";

    select.innerHTML =
      `<option value="">${inicio}</option>`;

    categorias.forEach(categoria => {
      select.innerHTML += `
        <option value="${categoria.id}">
          ${escapeHtml(categoria.nombre)}
        </option>
      `;
    });

    if (valor) {
      select.value = valor;
    }
  });
}

function renderCategorias() {
  const contenedor =
    document.getElementById("listaCategorias");

  if (!contenedor) return;

  const texto =
    document.getElementById("buscarCategoria")
      ?.value
      ?.toLowerCase()
      .trim() || "";

  const filtradas =
    categorias.filter(c =>
      c.nombre
        .toLowerCase()
        .includes(texto)
    );

  contenedor.innerHTML = "";

  if (!filtradas.length) {
    contenedor.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info">
          No se encontraron categorías.
        </div>
      </div>
    `;

    return;
  }

  filtradas.forEach(categoria => {
    contenedor.innerHTML += `
      <div class="col-md-6 col-lg-4">
        <div class="card border-0 shadow h-100">
          <div class="card-body">

            <div class="d-flex justify-content-between align-items-center mb-3">

              <h5 class="fw-bold mb-0">
                <i class="bi bi-tag me-2"></i>
                ${escapeHtml(categoria.nombre)}
              </h5>

              <span class="badge ${categoria.activo === false
        ? "bg-secondary"
        : "bg-success"
      }">
                ${categoria.activo === false
        ? "Inactiva"
        : "Activa"
      }
              </span>

            </div>

            <div class="d-flex gap-2">

              ${esAdmin()
        ? `
                    <button
                      class="btn btn-warning btn-sm flex-fill"
                      onclick="editarCategoria(${categoria.id})">
                      <i class="bi bi-pencil me-1"></i>
                      Editar
                    </button>
                  `
        : ""
      }

              ${esAdmin() &&
        categoria.activo !== false
        ? `
                    <button
                      class="btn btn-danger btn-sm flex-fill"
                      onclick="eliminarCategoria(${categoria.id})">
                      <i class="bi bi-trash me-1"></i>
                      Desactivar
                    </button>
                  `
        : ""
      }

              ${esAdmin() &&
        categoria.activo === false
        ? `
                    <button
                      class="btn btn-success btn-sm flex-fill"
                      onclick="reactivarCategoria(${categoria.id})">
                      <i class="bi bi-arrow-counterclockwise me-1"></i>
                      Reactivar
                    </button>
                  `
        : ""
      }

            </div>

          </div>
        </div>
      </div>
    `;
  });
}

function abrirModalCategoria() {
  const modal = document.getElementById("modalCategoria");

  if (!modal) return;

  bootstrap.Modal.getOrCreateInstance(modal).show();
}

async function guardarCategoria() {
  if (!esAdmin()) {
    return alertaError(
      "No tiene permisos para realizar esta acción."
    );
  }

  const nombre =
    document
      .getElementById("nombreCategoria")
      .value
      .trim();

  if (!nombre) {
    return alertaError(
      "Ingrese el nombre de la categoría."
    );
  }

  try {
    const res = await fetch(
      `${API}/categorias`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nombre })
      }
    );

    if (!res.ok) {
      const error = await res.json();

      throw new Error(
        Array.isArray(error.message)
          ? error.message.join(" ")
          : error.message ||
          "No se pudo crear la categoría."
      );
    }

    alertaExito("Categoría registrada");

    document.getElementById(
      "nombreCategoria"
    ).value = "";

    bootstrap.Modal.getInstance(
      document.getElementById("modalCategoria")
    )?.hide();

    await cargarCategorias();
    cargarProductos();
  } catch (error) {
    alertaError(error.message);
  }
}

function editarCategoria(id) {
  const categoria =
    categorias.find(c => c.id === id);

  if (!categoria) return;

  document.getElementById(
    "editarCategoriaId"
  ).value = categoria.id;

  document.getElementById(
    "editarNombreCategoria"
  ).value = categoria.nombre;

  new bootstrap.Modal(
    document.getElementById(
      "modalEditarCategoria"
    )
  ).show();
}

async function guardarEdicionCategoria() {
  const id = Number(
    document.getElementById(
      "editarCategoriaId"
    ).value
  );

  const nombre =
    document
      .getElementById(
        "editarNombreCategoria"
      )
      .value
      .trim();

  if (!id || !nombre) {
    return alertaError(
      "Ingrese el nombre de la categoría."
    );
  }

  try {
    const res = await fetch(
      `${API}/categorias/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nombre })
      }
    );

    if (!res.ok) {
      const error = await res.json();

      throw new Error(
        Array.isArray(error.message)
          ? error.message.join(" ")
          : error.message ||
          "No se pudo actualizar la categoría."
      );
    }

    alertaExito("Categoría actualizada");

    bootstrap.Modal.getInstance(
      document.getElementById(
        "modalEditarCategoria"
      )
    )?.hide();

    await cargarCategorias();
    cargarProductos();
  } catch (error) {
    alertaError(error.message);
  }
}

async function eliminarCategoria(id) {
  const ok = await confirmar(
    "¿Desactivar categoría?",
    "La categoría dejará de estar disponible."
  );

  if (!ok) return;

  try {
    const res = await fetch(
      `${API}/categorias/${id}`,
      {
        method: "DELETE"
      }
    );

    if (!res.ok) {
      const error = await res.json();

      throw new Error(
        Array.isArray(error.message)
          ? error.message.join(" ")
          : error.message ||
          "No se pudo desactivar la categoría."
      );
    }

    alertaExito("Categoría desactivada");

    await cargarCategorias();
    cargarProductos();
  } catch (error) {
    alertaError(error.message);
  }
}

async function reactivarCategoria(id) {
  const ok = await confirmar(
    "¿Reactivar categoría?",
    "La categoría volverá a estar disponible."
  );

  if (!ok) return;

  try {
    const res = await fetch(
      `${API}/categorias/${id}/reactivar`,
      {
        method: "PATCH"
      }
    );

    if (!res.ok) {
      throw new Error(
        "No se pudo reactivar la categoría."
      );
    }

    alertaExito("Categoría reactivada");

    await cargarCategorias();
    cargarProductos();
  } catch (error) {
    alertaError(error.message);
  }
}
async function mostrarCategoriasInactivas() {
  try {
    const res = await fetch(`${API}/categorias/todos`);

    if (!res.ok) {
      throw new Error("No se pudieron cargar las categorías inactivas.");
    }

    const lista = await res.json();
    const inactivas = lista.filter(c => !c.activo);
    const contenedor = document.getElementById("categoriasInactivas");

    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!inactivas.length) {
      contenedor.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info mb-0">
            No existen categorías inactivas.
          </div>
        </div>
      `;
    } else {
      inactivas.forEach(categoria => {
        contenedor.innerHTML += `
          <div class="col-md-6 col-lg-4 mb-3">
            <div class="card border-danger shadow-sm h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h5 class="fw-bold mb-0">
                    <i class="bi bi-tag me-2"></i>
                    ${escapeHtml(categoria.nombre)}
                  </h5>
                  <span class="badge bg-danger">Inactiva</span>
                </div>
                ${esAdmin() ? `
                  <button
                    class="btn btn-success w-100"
                    onclick="reactivarCategoriaDesdeInactivos(${categoria.id})">
                    <i class="bi bi-arrow-counterclockwise me-1"></i>
                    Reactivar
                  </button>
                ` : ""}
              </div>
            </div>
          </div>
        `;
      });
    }

    const modal = bootstrap.Modal.getOrCreateInstance(
      document.getElementById("modalCategoriasInactivas")
    );

    modal.show();
  } catch (error) {
    alertaError(error.message || "No se pudieron cargar las categorías inactivas.");
  }
}

async function reactivarCategoriaDesdeInactivos(id) {
  const ok = await confirmar(
    "¿Reactivar categoría?",
    "La categoría volverá a estar disponible."
  );

  if (!ok) return;

  try {
    const res = await fetch(`${API}/categorias/${id}/reactivar`, {
      method: "PATCH"
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "No se pudo reactivar la categoría.");
    }

    alertaExito("Categoría reactivada");

    await cargarCategorias();
    await cargarProductos();

    bootstrap.Modal.getInstance(
      document.getElementById("modalCategoriasInactivas")
    )?.hide();
  } catch (error) {
    alertaError(error.message);
  }
}
async function cargarMetodosPago() {
  try {
    const res = await fetch(
      `${API}/metodos-pago`
    );

    if (!res.ok) {
      throw new Error(
        "No se pudieron cargar los métodos de pago."
      );
    }

    metodosPago = await res.json();

    renderMetodosPago();
    cargarMetodosPagoVenta();
    prepararFiltrosHistorial();
  } catch (error) {
    alertaError(error.message);
  }
}

function renderMetodosPago() {
  const contenedor =
    document.getElementById(
      "listaMetodosPago"
    );

  if (!contenedor) return;

  const texto =
    document.getElementById(
      "buscarMetodoPago"
    )
      ?.value
      ?.toLowerCase()
      .trim() || "";

  const filtrados =
    metodosPago.filter(m =>
      (m.nombre || "")
        .toLowerCase()
        .includes(texto)
    );

  contenedor.innerHTML =
    filtrados.length
      ? filtrados
        .map(
          metodo => `
              <div class="col-md-6 col-lg-4">
                <div class="card border-0 shadow h-100">
                  <div class="card-body">

                    <div class="d-flex justify-content-between align-items-center mb-3">

                      <h5 class="fw-bold mb-0">
                        <i class="bi bi-credit-card me-2"></i>
                        ${escapeHtml(metodo.nombre)}
                      </h5>

                      <span class="badge bg-success">
                        Activo
                      </span>

                    </div>

                    ${esAdmin()
              ? `
                          <div class="d-flex gap-2">

                            <button
                              class="btn btn-warning btn-sm flex-fill"
                              onclick="editarMetodoPago(${metodo.id})">
                              <i class="bi bi-pencil me-1"></i>
                              Editar
                            </button>

                            <button
                              class="btn btn-danger btn-sm flex-fill"
                              onclick="eliminarMetodoPago(${metodo.id})">
                              <i class="bi bi-trash me-1"></i>
                              Desactivar
                            </button>

                          </div>
                        `
              : ""
            }

                  </div>
                </div>
              </div>
            `
        )
        .join("")
      : `
        <div class="col-12">
          <div class="alert alert-info">
            No se encontraron métodos de pago.
          </div>
        </div>
      `;
}

async function guardarMetodoPago() {
  if (!esAdmin()) {
    return alertaError(
      "No tiene permisos para realizar esta acción."
    );
  }

  const nombre =
    document
      .getElementById("nombreMetodoPago")
      .value
      .trim();

  if (!nombre) {
    return alertaError(
      "Ingrese el nombre del método de pago."
    );
  }

  try {
    const res = await fetch(
      `${API}/metodos-pago`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nombre })
      }
    );

    if (!res.ok) {
      const error = await res.json();

      throw new Error(
        Array.isArray(error.message)
          ? error.message.join(" ")
          : error.message ||
          "No se pudo crear el método de pago."
      );
    }

    alertaExito(
      "Método de pago registrado"
    );

    document.getElementById(
      "nombreMetodoPago"
    ).value = "";

    bootstrap.Modal.getInstance(
      document.getElementById(
        "modalMetodoPago"
      )
    )?.hide();

    await cargarMetodosPago();
  } catch (error) {
    alertaError(error.message);
  }
}

function editarMetodoPago(id) {
  const metodo =
    metodosPago.find(
      m => m.id === id
    );

  if (!metodo) return;

  document.getElementById(
    "editarMetodoPagoId"
  ).value = metodo.id;

  document.getElementById(
    "editarNombreMetodoPago"
  ).value = metodo.nombre;

  new bootstrap.Modal(
    document.getElementById(
      "modalEditarMetodoPago"
    )
  ).show();
}

async function guardarEdicionMetodoPago() {
  const id = Number(
    document.getElementById(
      "editarMetodoPagoId"
    ).value
  );

  const nombre =
    document
      .getElementById(
        "editarNombreMetodoPago"
      )
      .value
      .trim();

  if (!id || !nombre) {
    return alertaError(
      "Ingrese el nombre del método de pago."
    );
  }

  try {
    const res = await fetch(
      `${API}/metodos-pago/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nombre })
      }
    );

    if (!res.ok) {
      const error = await res.json();

      throw new Error(
        Array.isArray(error.message)
          ? error.message.join(" ")
          : error.message ||
          "No se pudo actualizar el método de pago."
      );
    }

    alertaExito(
      "Método de pago actualizado"
    );

    bootstrap.Modal.getInstance(
      document.getElementById(
        "modalEditarMetodoPago"
      )
    )?.hide();

    await cargarMetodosPago();
  } catch (error) {
    alertaError(error.message);
  }
}

async function eliminarMetodoPago(id) {
  const ok = await confirmar(
    "¿Desactivar método de pago?",
    "No podrá utilizarse para nuevas ventas."
  );

  if (!ok) return;

  try {
    const res = await fetch(
      `${API}/metodos-pago/${id}`,
      {
        method: "DELETE"
      }
    );

    if (!res.ok) {
      const error = await res.json();

      throw new Error(
        Array.isArray(error.message)
          ? error.message.join(" ")
          : error.message ||
          "No se pudo desactivar el método de pago."
      );
    }

    alertaExito(
      "Método de pago desactivado"
    );

    await cargarMetodosPago();
  } catch (error) {
    alertaError(error.message);
  }
}
async function mostrarMetodosPagoInactivos() {
  try {
    const res = await fetch(`${API}/metodos-pago/todos`);

    if (!res.ok) {
      throw new Error("No se pudieron cargar los métodos de pago inactivos.");
    }

    const lista = await res.json();
    const inactivos = lista.filter(m => !m.activo);
    const contenedor = document.getElementById("metodosPagoInactivos");

    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!inactivos.length) {
      contenedor.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info mb-0">
            No existen métodos de pago inactivos.
          </div>
        </div>
      `;
    } else {
      inactivos.forEach(metodo => {
        contenedor.innerHTML += `
          <div class="col-md-6 col-lg-4 mb-3">
            <div class="card border-danger shadow-sm h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h5 class="fw-bold mb-0">
                    <i class="bi bi-credit-card me-2"></i>
                    ${escapeHtml(metodo.nombre)}
                  </h5>
                  <span class="badge bg-danger">Inactivo</span>
                </div>
                ${esAdmin() ? `
                  <button
                    class="btn btn-success w-100"
                    onclick="reactivarMetodoPago(${metodo.id})">
                    <i class="bi bi-arrow-counterclockwise me-1"></i>
                    Reactivar
                  </button>
                ` : ""}
              </div>
            </div>
          </div>
        `;
      });
    }

    const modal = bootstrap.Modal.getOrCreateInstance(
      document.getElementById("modalMetodosPagoInactivos")
    );

    modal.show();
  } catch (error) {
    alertaError(error.message || "No se pudieron cargar los métodos de pago inactivos.");
  }
}

async function reactivarMetodoPago(id) {
  const ok = await confirmar(
    "¿Reactivar método de pago?",
    "Volverá a estar disponible para nuevas ventas."
  );

  if (!ok) return;

  try {
    const res = await fetch(`${API}/metodos-pago/${id}/reactivar`, {
      method: "PATCH"
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "No se pudo reactivar el método de pago.");
    }

    alertaExito("Método de pago reactivado");

    await cargarMetodosPago();

    bootstrap.Modal.getInstance(
      document.getElementById("modalMetodosPagoInactivos")
    )?.hide();
  } catch (error) {
    alertaError(error.message);
  }
}

async function cargarClientes() {
  try {
    const texto =
      document.getElementById(
        "buscarCliente"
      )
        ?.value
        ?.trim() || "";

    const params =
      new URLSearchParams({
        page: "1",
        limit: "100"
      });

    if (texto) {
      params.append(
        "buscar",
        texto
      );
    }

    const res = await fetch(
      `${API}/clientes?${params.toString()}`
    );

    if (!res.ok) {
      throw new Error(
        "No se pudieron cargar los clientes."
      );
    }

    const resultado =
      await res.json();

    clientes =
      resultado.data || [];

    renderClientes();
  } catch (error) {
    alertaError(error.message);
  }
}

function renderClientes() {
  const contenedor =
    document.getElementById(
      "listaClientes"
    );

  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!clientes.length) {
    contenedor.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info">
          No se encontraron clientes.
        </div>
      </div>
    `;

    return;
  }

  clientes.forEach(cliente => {
    contenedor.innerHTML += `
      <div class="col-lg-4 col-md-6">
        <div class="card border-0 shadow h-100">
          <div class="card-body">

            <div class="d-flex justify-content-between align-items-start mb-3">

              <div>
                <h5 class="fw-bold mb-1">
                  ${escapeHtml(cliente.nombre)}
                  ${escapeHtml(cliente.apellido)}
                </h5>

                <span class="badge bg-success">
                  Activo
                </span>
              </div>

              <span class="badge bg-primary">
                ID ${cliente.id}
              </span>

            </div>

            <p class="mb-2">
              <i class="bi bi-envelope me-2"></i>
              ${escapeHtml(cliente.email)}
            </p>

            <p class="mb-3">
              <i class="bi bi-telephone me-2"></i>
              ${escapeHtml(
      cliente.telefono ||
      "Sin teléfono"
    )}
            </p>

            ${esAdmin()
        ? `
                  <div class="d-flex gap-2">

                    <button
                      class="btn btn-warning btn-sm flex-fill"
                      onclick="editarCliente(${cliente.id})">
                      <i class="bi bi-pencil me-1"></i>
                      Editar
                    </button>

                    <button
                      class="btn btn-danger btn-sm flex-fill"
                      onclick="eliminarCliente(${cliente.id})">
                      <i class="bi bi-trash me-1"></i>
                      Dar de baja
                    </button>

                  </div>
                `
        : ""
      }

          </div>
        </div>
      </div>
    `;
  });
}

async function guardarCliente() {
  if (!esAdmin()) {
    return alertaError(
      "No tiene permisos para realizar esta acción."
    );
  }

  const nombre =
    document
      .getElementById("nombreCliente")
      .value
      .trim();

  const apellido =
    document
      .getElementById("apellidoCliente")
      .value
      .trim();

  const email =
    document
      .getElementById("emailCliente")
      .value
      .trim();

  const telefono =
    document
      .getElementById("telefonoCliente")
      .value
      .trim();

  if (!nombre || !apellido || !email) {
    return alertaError(
      "Complete nombre, apellido y email."
    );
  }

  try {
    const res = await fetch(
      `${API}/clientes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre,
          apellido,
          email,
          telefono
        })
      }
    );

    if (!res.ok) {
      const error = await res.json();

      throw new Error(
        Array.isArray(error.message)
          ? error.message.join(" ")
          : error.message ||
          "No se pudo crear el cliente."
      );
    }

    alertaExito(
      "Cliente registrado"
    );

    [
      "nombreCliente",
      "apellidoCliente",
      "emailCliente",
      "telefonoCliente"
    ].forEach(
      id =>
        document.getElementById(
          id
        ).value = ""
    );

    bootstrap.Modal.getInstance(
      document.getElementById(
        "modalCliente"
      )
    )?.hide();

    await cargarClientes();
    await cargarClientesVenta();
  } catch (error) {
    alertaError(error.message);
  }
}

async function editarCliente(id) {
  try {
    const res = await fetch(
      `${API}/clientes/${id}`
    );

    if (!res.ok) {
      throw new Error(
        "No se pudo obtener el cliente."
      );
    }

    const cliente =
      await res.json();

    document.getElementById(
      "editarClienteId"
    ).value = cliente.id;

    document.getElementById(
      "editarNombreCliente"
    ).value =
      cliente.nombre || "";

    document.getElementById(
      "editarApellidoCliente"
    ).value =
      cliente.apellido || "";

    document.getElementById(
      "editarEmailCliente"
    ).value =
      cliente.email || "";

    document.getElementById(
      "editarTelefonoCliente"
    ).value =
      cliente.telefono || "";

    new bootstrap.Modal(
      document.getElementById(
        "modalEditarCliente"
      )
    ).show();
  } catch (error) {
    alertaError(error.message);
  }
}

async function guardarEdicionCliente() {
  const id = Number(
    document.getElementById(
      "editarClienteId"
    ).value
  );

  const nombre =
    document
      .getElementById(
        "editarNombreCliente"
      )
      .value
      .trim();

  const apellido =
    document
      .getElementById(
        "editarApellidoCliente"
      )
      .value
      .trim();

  const email =
    document
      .getElementById(
        "editarEmailCliente"
      )
      .value
      .trim();

  const telefono =
    document
      .getElementById(
        "editarTelefonoCliente"
      )
      .value
      .trim();

  if (
    !id ||
    !nombre ||
    !apellido ||
    !email
  ) {
    return alertaError(
      "Complete nombre, apellido y email."
    );
  }

  try {
    const res = await fetch(
      `${API}/clientes/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre,
          apellido,
          email,
          telefono
        })
      }
    );

    if (!res.ok) {
      const error = await res.json();

      throw new Error(
        Array.isArray(error.message)
          ? error.message.join(" ")
          : error.message ||
          "No se pudo actualizar el cliente."
      );
    }

    alertaExito(
      "Cliente actualizado"
    );

    bootstrap.Modal.getInstance(
      document.getElementById(
        "modalEditarCliente"
      )
    )?.hide();

    await cargarClientes();
    await cargarClientesVenta();
  } catch (error) {
    alertaError(error.message);
  }
}

async function eliminarCliente(id) {
  const ok = await confirmar(
    "¿Dar de baja al cliente?",
    "No podrá utilizarse para nuevas ventas."
  );

  if (!ok) return;

  try {
    const res = await fetch(
      `${API}/clientes/${id}`,
      {
        method: "DELETE"
      }
    );

    if (!res.ok) {
      const error = await res.json();

      throw new Error(
        Array.isArray(error.message)
          ? error.message.join(" ")
          : error.message ||
          "No se pudo dar de baja al cliente."
      );
    }

    alertaExito(
      "Cliente dado de baja"
    );

    await cargarClientes();
    await cargarClientesVenta();
  } catch (error) {
    alertaError(error.message);
  }
}

async function mostrarClientesInactivos() {
  try {
    const res = await fetch(`${API}/clientes/todos`);

    if (!res.ok) {
      throw new Error("No se pudieron cargar los clientes inactivos.");
    }

    const lista = await res.json();
    const inactivos = lista.filter(c => !c.activo);
    const contenedor = document.getElementById("clientesInactivos");

    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!inactivos.length) {
      contenedor.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info mb-0">
            No existen clientes inactivos.
          </div>
        </div>
      `;
    } else {
      inactivos.forEach(cliente => {
        contenedor.innerHTML += `
          <div class="col-lg-4 col-md-6 mb-3">
            <div class="card border-danger shadow-sm h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 class="fw-bold mb-1">
                      ${escapeHtml(cliente.nombre)} ${escapeHtml(cliente.apellido)}
                    </h5>
                    <span class="badge bg-danger">Inactivo</span>
                  </div>
                  <span class="badge bg-secondary">ID ${cliente.id}</span>
                </div>
                <p class="mb-2">
                  <i class="bi bi-envelope me-2"></i>
                  ${escapeHtml(cliente.email)}
                </p>
                <p class="mb-3">
                  <i class="bi bi-telephone me-2"></i>
                  ${escapeHtml(cliente.telefono || "Sin teléfono")}
                </p>
                ${esAdmin() ? `
                  <button
                    class="btn btn-success w-100"
                    onclick="reactivarCliente(${cliente.id})">
                    <i class="bi bi-arrow-counterclockwise me-1"></i>
                    Reactivar
                  </button>
                ` : ""}
              </div>
            </div>
          </div>
        `;
      });
    }

    const modal = bootstrap.Modal.getOrCreateInstance(
      document.getElementById("modalClientesInactivos")
    );

    modal.show();
  } catch (error) {
    alertaError(error.message || "No se pudieron cargar los clientes inactivos.");
  }
}

async function reactivarCliente(id) {
  const ok = await confirmar(
    "¿Reactivar cliente?",
    "El cliente volverá a estar disponible para nuevas ventas."
  );

  if (!ok) return;

  try {
    const res = await fetch(`${API}/clientes/${id}/reactivar`, {
      method: "PATCH"
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "No se pudo reactivar el cliente.");
    }

    alertaExito("Cliente reactivado");

    await cargarClientes();
    await cargarClientesVenta();

    bootstrap.Modal.getInstance(
      document.getElementById("modalClientesInactivos")
    )?.hide();
  } catch (error) {
    alertaError(error.message);
  }
}

async function cargarClientesVenta() {
  const input =
    document.getElementById(
      "buscarClienteVenta"
    );

  const texto =
    input?.value?.trim() || "";

  const params =
    new URLSearchParams({
      page: "1",
      limit: "100"
    });

  if (texto) {
    params.append(
      "buscar",
      texto
    );
  }

  try {
    const res = await fetch(
      `${API}/clientes?${params.toString()}`
    );

    if (!res.ok) {
      throw new Error(
        "No se pudieron cargar los clientes."
      );
    }

    const resultado =
      await res.json();

    clientes =
      resultado.data || [];

    const select =
      document.getElementById(
        "clienteVenta"
      );

    if (!select) return;

    select.innerHTML =
      `<option value="">Seleccionar cliente</option>`;

    clientes.forEach(cliente => {
      select.innerHTML += `
        <option value="${cliente.id}">
          ${escapeHtml(cliente.nombre)}
          ${escapeHtml(cliente.apellido)}
          -
          ${escapeHtml(cliente.email)}
        </option>
      `;
    });

    actualizarCarrito();
  } catch (error) {
    alertaError(error.message);
  }
}

async function cargarMetodosPagoVenta() {
  try {
    const res = await fetch(
      `${API}/metodos-pago`
    );

    if (!res.ok) {
      throw new Error(
        "No se pudieron cargar los métodos de pago."
      );
    }

    metodosPago =
      await res.json();

    const select =
      document.getElementById(
        "metodoPagoVenta"
      );

    if (!select) return;

    select.innerHTML =
      `<option value="">Seleccionar método de pago</option>`;

    metodosPago.forEach(metodo => {
      select.innerHTML += `
        <option value="${metodo.id}">
          ${escapeHtml(metodo.nombre)}
        </option>
      `;
    });
  } catch (error) {
    alertaError(error.message);
  }
}

async function cargarProductosVenta() {
  try {
    const res = await fetch(
      `${API}/productos?page=1&limit=100`
    );

    if (!res.ok) {
      throw new Error(
        "No se pudieron cargar los productos."
      );
    }

    const resultado =
      await res.json();

    productos =
      Array.isArray(resultado)
        ? resultado
        : resultado.data || [];

    renderProductosVenta();
  } catch (error) {
    alertaError(error.message);
  }
}

function renderProductosVenta() {
  const select =
    document.getElementById(
      "productoVenta"
    );

  if (!select) return;

  const texto =
    document.getElementById(
      "buscarProductoVenta"
    )
      ?.value
      ?.toLowerCase()
      .trim() || "";

  const seleccionActual =
    select.value;

  const filtrados =
    productos.filter(producto => {
      const contenido = `
        ${producto.nombre || ""}
        ${producto.descripcion || ""}
        ${producto.detalle || ""}
      `.toLowerCase();

      return contenido.includes(texto);
    });

  select.innerHTML =
    `<option value="">Seleccionar producto</option>`;

  filtrados.forEach(producto => {
    select.innerHTML += `
      <option value="${producto.id}">
        ${escapeHtml(producto.nombre)}
        -
        ${escapeHtml(
      producto.descripcion ||
      "Sin descripción"
    )}
        -
        $${Number(
      producto.precio || 0
    ).toLocaleString("es-AR")}
        -
        Stock: ${producto.stock}
      </option>
    `;
  });

  if (
    [...select.options].some(
      option =>
        option.value ==
        seleccionActual
    )
  ) {
    select.value =
      seleccionActual;
  }
}

function agregarAlCarrito() {
  const productoId =
    Number(
      document.getElementById(
        "productoVenta"
      ).value
    );

  const cantidad =
    Number(
      document.getElementById(
        "cantidadVenta"
      ).value
    );

  if (
    !productoId ||
    cantidad <= 0
  ) {
    alertaError(
      "Seleccione un producto e ingrese una cantidad válida."
    );
    return;
  }

  const producto =
    productos.find(
      p => p.id == productoId
    );

  if (!producto) {
    return alertaError(
      "No se encontró el producto seleccionado."
    );
  }

  const existente =
    carrito.find(
      item =>
        item.productoId ===
        producto.id
    );

  const cantidadNueva =
    (existente?.cantidad || 0) +
    cantidad;

  if (
    cantidadNueva >
    Number(producto.stock)
  ) {
    alertaError(
      `Stock insuficiente. Stock disponible: ${producto.stock}.`
    );
    return;
  }

  if (existente) {
    existente.cantidad =
      cantidadNueva;
  } else {
    carrito.push({
      productoId: producto.id,
      nombre: producto.nombre,
      descripcion:
        producto.descripcion,
      precio:
        Number(producto.precio),
      cantidad
    });
  }

  actualizarCarrito();

  document.getElementById(
    "productoVenta"
  ).value = "";

  document.getElementById(
    "buscarProductoVenta"
  ).value = "";

  document.getElementById(
    "cantidadVenta"
  ).value = 1;

  renderProductosVenta();
}

function actualizarCarrito() {
  const tabla =
    document.getElementById(
      "carrito"
    );

  if (!tabla) return;

  const clienteSelect =
    document.getElementById(
      "clienteVenta"
    );

  const clienteNombre =
    clienteSelect
      ?.selectedOptions?.[0]
      ?.textContent
      ?.split(" - ")[0]
      ?.trim() ||
    "Sin cliente seleccionado";

  tabla.innerHTML = `
    <div class="alert alert-light border mb-3">
      <strong>
        <i class="bi bi-person me-1"></i>
        Cliente:
      </strong>
      ${escapeHtml(clienteNombre)}
    </div>

    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">

        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Cantidad</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>

        <tbody id="carritoItems"></tbody>

      </table>
    </div>
  `;

  const cuerpo =
    document.getElementById(
      "carritoItems"
    );

  let total = 0;

  carrito.forEach(
    (item, index) => {
      const subtotal =
        item.precio *
        item.cantidad;

      total += subtotal;

      cuerpo.innerHTML += `
        <tr>

          <td>
            <div class="fw-bold">
              ${escapeHtml(item.nombre)}
            </div>

            <small class="text-muted">
              ${escapeHtml(
        item.descripcion ||
        "Sin descripción"
      )}
            </small>
          </td>

          <td>
            $${Number(
        item.precio
      ).toLocaleString("es-AR")}
          </td>

          <td>
            ${item.cantidad}
          </td>

          <td class="fw-bold text-success">
            $${Number(
        subtotal
      ).toLocaleString("es-AR")}
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
    }
  );

  if (!carrito.length) {
    cuerpo.innerHTML = `
      <tr>
        <td
          colspan="5"
          class="text-center text-muted py-4">
          El carrito está vacío.
        </td>
      </tr>
    `;
  }

  document.getElementById(
    "totalCarrito"
  ).innerText =
    `$${Number(total).toLocaleString("es-AR")}`;
}

function eliminarDelCarrito(indice) {
  carrito.splice(
    indice,
    1
  );

  actualizarCarrito();
}

async function realizarVenta() {
  if (!carrito.length) {
    return alertaError(
      "Debe agregar al menos un producto al carrito."
    );
  }

  const clienteId =
    Number(
      document.getElementById(
        "clienteVenta"
      ).value
    );

  const metodoPagoId =
    Number(
      document.getElementById(
        "metodoPagoVenta"
      ).value
    );

  const empleadoId = Number(
    document.getElementById("empleadoVenta").value
  );
  if (!empleadoId) {
    return alertaError("Debe seleccionar el empleado que realiza la venta.");
  }

  if (!clienteId) {
    return alertaError(
      "Debe seleccionar un cliente."
    );
  }

  if (!metodoPagoId) {
    return alertaError(
      "Debe seleccionar un método de pago."
    );
  }

  try {
    const res = await fetch(
      `${API}/ventas`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clienteId,
          metodoPagoId,
          empleadoId,
          productos: carrito.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad
          }))
        })
      }
    );

    if (!res.ok) {
      const error =
        await res.json();

      throw new Error(
        Array.isArray(error.message)
          ? error.message.join(" ")
          : error.message ||
          "No se pudo registrar la venta."
      );
    }

    alertaExito(
      "Venta registrada",
      "La venta fue registrada correctamente."
    );

    carrito = [];

    document.getElementById(
      "clienteVenta"
    ).value = "";

    document.getElementById(
      "metodoPagoVenta"
    ).value = "";

    document.getElementById(
      "productoVenta"
    ).value = "";

    document.getElementById(
      "buscarClienteVenta"
    ).value = "";

    document.getElementById(
      "buscarProductoVenta"
    ).value = "";

    document.getElementById(
      "cantidadVenta"
    ).value = 1;

    document.getElementById("empleadoVenta").value = "";

    actualizarCarrito();
    renderProductosVenta();

    await cargarProductos();
    await cargarProductosVenta();
    await cargarClientesVenta();
    await cargarMetodosPagoVenta();

    paginaHistorial = 1;
    cargarHistorial();
    cargarDashboard();
  } catch (error) {
    alertaError(
      error.message ||
      "Error al registrar la venta."
    );
  }
}

async function cargarHistorial() {
  try {
    const desde =
      document.getElementById(
        "historialDesde"
      )?.value || "";

    const hasta =
      document.getElementById(
        "historialHasta"
      )?.value || "";

    const clienteId =
      document.getElementById(
        "historialCliente"
      )?.value || "";

    const metodoPagoId =
      document.getElementById(
        "historialMetodoPago"
      )?.value || "";

    if (
      desde &&
      hasta &&
      desde > hasta
    ) {
      alertaError(
        "La fecha Desde no puede ser posterior a Hasta."
      );
      return;
    }

    const params =
      new URLSearchParams({
        page:
          String(paginaHistorial),
        limit:
          String(limiteHistorial)
      });

    if (desde) {
      params.append(
        "desde",
        desde
      );
    }

    if (hasta) {
      params.append(
        "hasta",
        hasta
      );
    }

    if (clienteId) {
      params.append(
        "clienteId",
        clienteId
      );
    }

    if (metodoPagoId) {
      params.append(
        "metodoPagoId",
        metodoPagoId
      );
    }

    const res = await fetch(
      `${API}/ventas?${params.toString()}`
    );

    if (!res.ok) {
      throw new Error(
        "No se pudo cargar el historial."
      );
    }

    const resultado =
      await res.json();

    const ventas =
      resultado.data || [];

    const total =
      Number(
        resultado.total || 0
      );

    const totalPaginas =
      Math.max(
        1,
        Number(
          resultado.totalPages ||
          Math.ceil(
            total /
            limiteHistorial
          ) ||
          1
        )
      );

    const tabla =
      document.getElementById(
        "tablaHistorial"
      );

    if (!tabla) return;

    tabla.innerHTML = "";

    if (!ventas.length) {
      tabla.innerHTML = `
        <tr>
          <td
            colspan="7"
            class="text-center text-muted py-4">
            No existen ventas para los filtros seleccionados.
          </td>
        </tr>
      `;
    } else {
      ventas.forEach(
        venta => {
          const cliente =
            venta.cliente
              ? `${venta.cliente.nombre} ${venta.cliente.apellido}`
              : "Sin cliente";

          const metodo =
            venta.metodoPago?.nombre ||
            "Sin método";

          const cantidadProductos =
            (venta.detalles || [])
              .reduce(
                (total, detalle) =>
                  total +
                  Number(
                    detalle.cantidad ||
                    0
                  ),
                0
              );

          tabla.innerHTML += `
            <tr>

              <td>
                ${new Date(
            venta.fecha
          ).toLocaleString("es-AR")}
              </td>

              <td>
                ${escapeHtml(cliente)}
              </td>

              <td>
                ${escapeHtml(metodo)}
              </td>

              <td>
                ${cantidadProductos}
              </td>

              <td class="fw-bold">
                $${Number(
            venta.total || 0
          ).toLocaleString("es-AR")}
              </td>

              <td>
                ${(venta.detalles || [])
              .map(
                detalle =>
                  `${escapeHtml(
                    detalle.producto?.nombre ||
                    "Producto"
                  )} x${detalle.cantidad}`
              )
              .join("<br>")}
              </td>

              <td>
                <button
                  class="btn btn-outline-primary btn-sm"
                  onclick="verDetalleVenta(${venta.id})">
                  <i class="bi bi-eye"></i>
                </button>
              </td>

            </tr>
          `;
        }
      );
    }

    renderPaginacionHistorial(
      totalPaginas
    );
  } catch (error) {
    alertaError(
      error.message ||
      "Error al cargar historial."
    );
  }
}

function renderPaginacionHistorial(
  totalPaginas
) {
  const contenedor =
    document.getElementById(
      "paginacionHistorial"
    );

  if (!contenedor) return;

  if (totalPaginas <= 1) {
    contenedor.innerHTML = "";
    return;
  }

  contenedor.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mt-3">

      <button
        class="btn btn-outline-secondary"
        ${paginaHistorial <= 1
      ? "disabled"
      : ""
    }
        onclick="cambiarPaginaHistorial(${paginaHistorial - 1})">

        <i class="bi bi-chevron-left me-1"></i>
        Anterior

      </button>

      <span class="fw-bold">
        Página ${paginaHistorial}
        de ${totalPaginas}
      </span>

      <button
        class="btn btn-outline-secondary"
        ${paginaHistorial >=
      totalPaginas
      ? "disabled"
      : ""
    }
        onclick="cambiarPaginaHistorial(${paginaHistorial + 1})">

        Siguiente
        <i class="bi bi-chevron-right ms-1"></i>

      </button>

    </div>
  `;
}

function cambiarPaginaHistorial(
  pagina
) {
  if (pagina < 1) return;

  paginaHistorial =
    pagina;

  cargarHistorial();
}

async function prepararFiltrosHistorial() {
  const clienteSelect =
    document.getElementById(
      "historialCliente"
    );

  const metodoSelect =
    document.getElementById(
      "historialMetodoPago"
    );

  if (clienteSelect) {
    clienteSelect.innerHTML =
      `<option value="">Todos los clientes</option>`;

    clientes.forEach(
      cliente => {
        clienteSelect.innerHTML += `
          <option value="${cliente.id}">
            ${escapeHtml(
          cliente.nombre
        )}
            ${escapeHtml(
          cliente.apellido
        )}
          </option>
        `;
      }
    );
  }

  if (metodoSelect) {
    metodoSelect.innerHTML =
      `<option value="">Todos los métodos</option>`;

    metodosPago.forEach(
      metodo => {
        metodoSelect.innerHTML += `
          <option value="${metodo.id}">
            ${escapeHtml(
          metodo.nombre
        )}
          </option>
        `;
      }
    );
  }
}

function limpiarFiltrosHistorial() {
  paginaHistorial = 1;

  [
    "historialDesde",
    "historialHasta",
    "historialCliente",
    "historialMetodoPago"
  ].forEach(id => {
    const elemento =
      document.getElementById(id);

    if (elemento) {
      elemento.value = "";
    }
  });

  cargarHistorial();
}
async function verDetalleVenta(id) {
  try {
    const res = await fetch(
      `${API}/ventas/${id}`
    );

    if (!res.ok) {
      throw new Error(
        "No se pudo obtener el detalle de la venta."
      );
    }

    const venta =
      await res.json();

    const cliente =
      venta.cliente
        ? `${venta.cliente.nombre} ${venta.cliente.apellido}`
        : "Sin cliente";

    const metodo =
      venta.metodoPago?.nombre ||
      "Sin método de pago";

    const detalles =
      (venta.detalles || [])
        .map(
          detalle => `
            <tr>

              <td>
                ${escapeHtml(
            detalle.producto?.nombre ||
            "Producto"
          )}
              </td>

              <td>
                ${escapeHtml(
            detalle.producto?.descripcion ||
            "Sin descripción"
          )}
              </td>

              <td>
                ${detalle.cantidad}
              </td>

              <td>
                $${Number(
            detalle.precio_unitario ||
            0
          ).toLocaleString("es-AR")}
              </td>

              <td>
                $${Number(
            detalle.total ||
            0
          ).toLocaleString("es-AR")}
              </td>

            </tr>
          `
        )
        .join("");

    document.getElementById(
      "detalleVentaContenido"
    ).innerHTML = `
      <p>
        <strong>Venta:</strong>
        #${venta.id}
      </p>

      <p>
        <strong>Fecha:</strong>
        ${new Date(
      venta.fecha
    ).toLocaleString("es-AR")}
      </p>

      <p>
        <strong>Cliente:</strong>
        ${escapeHtml(cliente)}
      </p>

      <p>
        <strong>Método de pago:</strong>
        ${escapeHtml(metodo)}
      </p>

      <div class="table-responsive">

        <table class="table table-sm">

          <thead>
            <tr>
              <th>Producto</th>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>

          <tbody>
            ${detalles}
          </tbody>

        </table>

      </div>

      <h5 class="text-end">
        Total:
        $${Number(
      venta.total || 0
    ).toLocaleString("es-AR")}
      </h5>
    `;

    new bootstrap.Modal(
      document.getElementById(
        "modalDetalleVenta"
      )
    ).show();
  } catch (error) {
    alertaError(
      error.message
    );
  }
}

async function cargarDashboard() {
  try {
    const desde =
      document.getElementById(
        "dashboardDesde"
      )?.value || "";

    const hasta =
      document.getElementById(
        "dashboardHasta"
      )?.value || "";

    const clienteId =
      document.getElementById(
        "dashboardCliente"
      )?.value || "";

    if (
      desde &&
      hasta &&
      desde > hasta
    ) {
      alertaError(
        "La fecha Desde no puede ser posterior a Hasta."
      );
      return;
    }

    const params =
      new URLSearchParams();

    if (desde) {
      params.append(
        "desde",
        desde
      );
    }

    if (hasta) {
      params.append(
        "hasta",
        hasta
      );
    }

    if (clienteId) {
      params.append(
        "clienteId",
        clienteId
      );
    }

    const url =
      params.toString()
        ? `${API}/ventas/dashboard?${params}`
        : `${API}/ventas/dashboard`;

    const res =
      await fetch(url);

    if (!res.ok) {
      throw new Error(
        "No se pudo obtener la información del dashboard."
      );
    }

    const data =
      await res.json();

    document.getElementById(
      "totalIngresos"
    ).textContent =
      `$${Number(
        data.totalIngresos || 0
      ).toLocaleString("es-AR")}`;

    document.getElementById(
      "totalProductos"
    ).textContent =
      Number(
        data.totalProductos || 0
      ).toLocaleString("es-AR");

    document.getElementById(
      "cantidadVentas"
    ).textContent =
      Number(
        data.cantidadVentas || 0
      ).toLocaleString("es-AR");

    document.getElementById(
      "productoMasVendido"
    ).textContent =
      data.productoMasVendido ||
      "-";

    document.getElementById(
      "productosActivos"
    ).textContent =
      Number(
        data.productosActivos || 0
      ).toLocaleString("es-AR");

    document.getElementById(
      "cantidadProductosInactivos"
    ).textContent =
      Number(
        data.productosInactivos || 0
      ).toLocaleString("es-AR");

    const categoriasData =
      data.ventasPorCategoria ||
      [];

    const metodosData =
      data.ventasPorMetodoPago ||
      [];

    if (graficoCategorias) {
      graficoCategorias.destroy();
      graficoCategorias = null;
    }

    if (graficoMetodosPago) {
      graficoMetodosPago.destroy();
      graficoMetodosPago = null;
    }

    const canvasCategorias =
      document.getElementById(
        "graficoCategorias"
      );

    if (
      canvasCategorias &&
      categoriasData.length > 0
    ) {
      graficoCategorias =
        new Chart(
          canvasCategorias,
          {
            type: "bar",
            data: {
              labels:
                categoriasData.map(
                  item =>
                    item.categoria
                ),
              datasets: [
                {
                  label:
                    "Ventas por categoría",
                  data:
                    categoriasData.map(
                      item =>
                        Number(
                          item.total
                        )
                    )
                }
              ]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              }
            }
          }
        );
    }

    const canvasMetodosPago =
      document.getElementById(
        "graficoMetodosPago"
      );

    if (
      canvasMetodosPago &&
      metodosData.length > 0
    ) {
      graficoMetodosPago =
        new Chart(
          canvasMetodosPago,
          {
            type: "pie",
            data: {
              labels:
                metodosData.map(
                  item =>
                    item.metodoPago
                ),
              datasets: [
                {
                  data:
                    metodosData.map(
                      item =>
                        Number(
                          item.total
                        )
                    )
                }
              ]
            },
            options: {
              responsive: true
            }
          }
        );
    }

    const resumenCategorias =
      document.getElementById(
        "resumenCategorias"
      );

    if (resumenCategorias) {
      resumenCategorias.innerHTML = "";

      if (
        categoriasData.length === 0
      ) {
        resumenCategorias.innerHTML = `
          <p class="text-muted">
            No hay ventas para el período seleccionado.
          </p>
        `;
      } else {
        categoriasData.forEach(
          categoria => {
            resumenCategorias.innerHTML += `
              <div class="d-flex justify-content-between border-bottom py-2">
                <span>
                  ${escapeHtml(
              categoria.categoria
            )}
                </span>

                <strong>
                  $${Number(
              categoria.total
            ).toLocaleString(
              "es-AR"
            )}
                </strong>
              </div>
            `;
          }
        );
      }
    }

    const resumenMetodos =
      document.getElementById(
        "resumenMetodosPago"
      );

    if (resumenMetodos) {
      resumenMetodos.innerHTML = "";

      if (
        metodosData.length === 0
      ) {
        resumenMetodos.innerHTML = `
          <p class="text-muted">
            No hay ventas para el período seleccionado.
          </p>
        `;
      } else {
        metodosData.forEach(
          metodo => {
            resumenMetodos.innerHTML += `
              <div class="d-flex justify-content-between border-bottom py-2">
                <span>
                  ${escapeHtml(
              metodo.metodoPago
            )}
                </span>

                <strong>
                  $${Number(
              metodo.total
            ).toLocaleString(
              "es-AR"
            )}
                </strong>
              </div>
            `;
          }
        );
      }
    }
  } catch (error) {
    console.error(
      "Error dashboard:",
      error
    );

    alertaError(
      error.message ||
      "No se pudo cargar el dashboard."
    );
  }
}

function limpiarFiltroDashboard() {
  const desde =
    document.getElementById(
      "dashboardDesde"
    );

  const hasta =
    document.getElementById(
      "dashboardHasta"
    );

  const cliente =
    document.getElementById(
      "dashboardCliente"
    );

  if (desde) {
    desde.value = "";
  }

  if (hasta) {
    hasta.value = "";
  }

  if (cliente) {
    cliente.value = "";
  }

  cargarDashboard();
}

function alertaExito(
  titulo,
  texto = ""
) {
  Swal.fire({
    icon: "success",
    title: titulo,
    text: texto,
    confirmButtonText:
      "Aceptar",
    confirmButtonColor:
      "#198754"
  });
}

function alertaError(
  texto
) {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: texto,
    confirmButtonText:
      "Aceptar",
    confirmButtonColor:
      "#dc3545"
  });
}

function alertaInfo(
  texto
) {
  Swal.fire({
    icon: "info",
    title: "Información",
    text: texto,
    confirmButtonText:
      "Aceptar",
    confirmButtonColor:
      "#0d6efd"
  });
}

async function confirmar(
  titulo,
  texto
) {
  const resultado =
    await Swal.fire({
      title: titulo,
      text: texto,
      icon: "question",
      showCancelButton: true,
      confirmButtonText:
        "Sí",
      cancelButtonText:
        "Cancelar",
      confirmButtonColor:
        "#198754",
      cancelButtonColor:
        "#dc3545"
    });

  return resultado.isConfirmed;
}

function escapeHtml(
  texto
) {
  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    texto ?? "";

  return div.innerHTML;
}

window.onload =
  async () => {
    await cargarCategorias();
    await cargarMetodosPago();
    await cargarClientes();
    await cargarClientesDashboard();
    await cargarMetodosPagoVenta();
    await prepararFiltrosHistorial();
    await cargarProductos();
    await cargarProductosVenta();
    await cargarHistorial();
    await cargarDashboard();

    document
      .getElementById("buscarProducto")
      ?.addEventListener(
        "input",
        () => {
          paginaProductos = 1;
          cargarProductos();
        }
      );

    document
      .getElementById("filtroCategoria")
      ?.addEventListener(
        "change",
        () => {
          paginaProductos = 1;
          cargarProductos();
        }
      );

    document
      .getElementById(
        "buscarCategoria"
      )
      ?.addEventListener(
        "input",
        renderCategorias
      );

    document
      .getElementById(
        "buscarMetodoPago"
      )
      ?.addEventListener(
        "input",
        renderMetodosPago
      );

    document
      .getElementById(
        "buscarCliente"
      )
      ?.addEventListener(
        "input",
        cargarClientes
      );

    document
      .getElementById(
        "buscarClienteVenta"
      )
      ?.addEventListener(
        "input",
        cargarClientesVenta
      );

    document
      .getElementById(
        "clienteVenta"
      )
      ?.addEventListener(
        "change",
        actualizarCarrito
      );

    document
      .getElementById(
        "buscarProductoVenta"
      )
      ?.addEventListener(
        "input",
        renderProductosVenta
      );

    [
      "historialDesde",
      "historialHasta",
      "historialCliente",
      "historialMetodoPago"
    ].forEach(id => {
      document
        .getElementById(id)
        ?.addEventListener(
          "change",
          () => {
            paginaHistorial = 1;
            cargarHistorial();
          }
        );
    });

    if (!esAdmin()) {
      [
        "btnGuardarProducto",
        "btnNuevaCategoria",
        "btnNuevoMetodoPago",
        "btnNuevoCliente"
      ].forEach(id => {
        const boton =
          document.getElementById(
            id
          );

        if (boton) {
          boton.style.display =
            "none";
        }
      });
    }
  };
async function cargarClientesDashboard() {
  const select =
    document.getElementById(
      "dashboardCliente"
    );

  if (!select) return;

  try {
    const res =
      await fetch(
        `${API}/clientes/todos`
      );

    if (!res.ok) {
      throw new Error(
        "No se pudieron cargar los clientes."
      );
    }

    const datos =
      await res.json();

    const clientesActivos =
      datos.filter(
        cliente =>
          cliente.activo
      );

    select.innerHTML = `
      <option value="">
        Todos los clientes
      </option>
    `;

    clientesActivos.forEach(
      cliente => {
        select.innerHTML += `
          <option value="${cliente.id}">
            ${escapeHtml(
          `${cliente.nombre} ${cliente.apellido}`
        )}
          </option>
        `;
      }
    );
  } catch (error) {
    alertaError(
      error.message ||
      "No se pudieron cargar los clientes."
    );
  }
}
async function cargarEmpleados() {
  try {
    const buscar = document.getElementById("buscarEmpleado")?.value || "";

    const response = await fetch(
      `${API}/empleados?buscar=${encodeURIComponent(buscar)}&page=${paginaEmpleados}&limit=${limiteEmpleados}`
    );

    if (!response.ok) {
      throw new Error("Error al cargar empleados");
    }

    const resultado = await response.json();

    empleados = resultado.data || [];

    renderEmpleados();
    renderPaginacionEmpleados(resultado);
  } catch (error) {
    console.error(error);

    Swal.fire(
      "Error",
      "No se pudieron cargar los empleados.",
      "error"
    );
  }
}

function renderEmpleados() {
  const contenedor = document.getElementById("listaEmpleados");

  if (!contenedor) return;

  if (empleados.length === 0) {
    contenedor.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info">
          No hay empleados registrados.
        </div>
      </div>
    `;
    return;
  }

  contenedor.innerHTML = empleados.map(empleado => `
    <div class="col-md-6 col-xl-4">
      <div class="card border-0 shadow-lg h-100">
        <div class="card-body">

          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="fw-bold mb-1">
                ${empleado.nombre} ${empleado.apellido}
              </h5>

              <span class="badge bg-success">
                Activo
              </span>
            </div>

            <i class="bi bi-person-badge fs-2 text-primary"></i>
          </div>

          <p class="mb-2">
            <strong>DNI:</strong> ${empleado.dni}
          </p>

          <p class="mb-2">
            <strong>Teléfono:</strong> ${empleado.telefono || "-"}
          </p>

          <p class="mb-2">
            <strong>Email:</strong> ${empleado.email || "-"}
          </p>

          <p class="mb-2">
            <strong>Cargo:</strong> ${empleado.cargo}
          </p>

          <p class="mb-3">
            <strong>Fecha de ingreso:</strong> ${formatearFechaEmpleado(empleado.fechaIngreso)}
          </p>

          <div class="d-flex gap-2">
            <button
              class="btn btn-outline-primary btn-sm flex-fill"
              onclick="editarEmpleado(${empleado.id})">
              <i class="bi bi-pencil me-1"></i>Editar
            </button>

            <button
              class="btn btn-outline-danger btn-sm flex-fill"
              onclick="eliminarEmpleado(${empleado.id})">
              <i class="bi bi-person-x me-1"></i>Desactivar
            </button>
          </div>

        </div>
      </div>
    </div>
  `).join("");
}

function renderPaginacionEmpleados(resultado) {
  const contenedor = document.getElementById("paginacionEmpleados");

  if (!contenedor) return;

  if (resultado.totalPages <= 1) {
    contenedor.innerHTML = "";
    return;
  }

  let html = `
    <div class="d-flex justify-content-center mt-4">
      <nav>
        <ul class="pagination">
  `;

  html += `
    <li class="page-item ${resultado.page <= 1 ? "disabled" : ""}">
      <button class="page-link" onclick="cambiarPaginaEmpleados(${resultado.page - 1})">
        Anterior
      </button>
    </li>
  `;

  for (let i = 1; i <= resultado.totalPages; i++) {
    html += `
      <li class="page-item ${i === resultado.page ? "active" : ""}">
        <button class="page-link" onclick="cambiarPaginaEmpleados(${i})">
          ${i}
        </button>
      </li>
    `;
  }

  html += `
    <li class="page-item ${resultado.page >= resultado.totalPages ? "disabled" : ""}">
      <button class="page-link" onclick="cambiarPaginaEmpleados(${resultado.page + 1})">
        Siguiente
      </button>
    </li>
  `;

  html += `
        </ul>
      </nav>
    </div>
  `;

  contenedor.innerHTML = html;
}

function cambiarPaginaEmpleados(pagina) {
  if (pagina < 1) return;

  paginaEmpleados = pagina;
  cargarEmpleados();
}

function formatearFechaEmpleado(fecha) {
  if (!fecha) return "-";

  const partes = String(fecha).split("T")[0].split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function abrirModalEmpleado() {
  document.getElementById("nombreEmpleado").value = "";
  document.getElementById("apellidoEmpleado").value = "";
  document.getElementById("dniEmpleado").value = "";
  document.getElementById("telefonoEmpleado").value = "";
  document.getElementById("emailEmpleado").value = "";
  document.getElementById("cargoEmpleado").value = "";
  document.getElementById("fechaIngresoEmpleado").value = "";

  const modal = new bootstrap.Modal(
    document.getElementById("modalEmpleado")
  );

  modal.show();
}
async function guardarEmpleado() {
  const empleado = {
    nombre: document.getElementById("nombreEmpleado").value.trim(),
    apellido: document.getElementById("apellidoEmpleado").value.trim(),
    dni: document.getElementById("dniEmpleado").value.trim(),
    telefono: document.getElementById("telefonoEmpleado").value.trim(),
    email: document.getElementById("emailEmpleado").value.trim(),
    cargo: document.getElementById("cargoEmpleado").value.trim(),
    fechaIngreso: document.getElementById("fechaIngresoEmpleado").value
  };

  if (
    !empleado.nombre ||
    !empleado.apellido ||
    !empleado.dni ||
    !empleado.cargo ||
    !empleado.fechaIngreso
  ) {
    Swal.fire(
      "Datos incompletos",
      "Completá todos los campos obligatorios.",
      "warning"
    );
    return;
  }

  try {
    const response = await fetch(`${API}/empleados`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(empleado)
    });

    const resultado = await response.json();

    if (!response.ok) {
      throw new Error(resultado.message || "Error al crear empleado");
    }

    Swal.fire(
      "Empleado creado",
      "El empleado fue registrado correctamente.",
      "success"
    );

    bootstrap.Modal.getInstance(
      document.getElementById("modalEmpleado")
    )?.hide();

    paginaEmpleados = 1;
    cargarEmpleados();
  } catch (error) {
    Swal.fire(
      "Error",
      error.message || "No se pudo crear el empleado.",
      "error"
    );
  }
}

async function editarEmpleado(id) {
  try {
    const response = await fetch(`${API}/empleados/${id}`);

    if (!response.ok) {
      throw new Error("No se pudo obtener el empleado");
    }

    const empleado = await response.json();

    document.getElementById("editarEmpleadoId").value = empleado.id;
    document.getElementById("editarNombreEmpleado").value = empleado.nombre || "";
    document.getElementById("editarApellidoEmpleado").value = empleado.apellido || "";
    document.getElementById("editarDniEmpleado").value = empleado.dni || "";
    document.getElementById("editarTelefonoEmpleado").value = empleado.telefono || "";
    document.getElementById("editarEmailEmpleado").value = empleado.email || "";
    document.getElementById("editarCargoEmpleado").value = empleado.cargo || "";
    document.getElementById("editarFechaIngresoEmpleado").value =
      String(empleado.fechaIngreso || "").split("T")[0];

    const modal = new bootstrap.Modal(
      document.getElementById("modalEditarEmpleado")
    );

    modal.show();
  } catch (error) {
    Swal.fire(
      "Error",
      "No se pudo cargar el empleado.",
      "error"
    );
  }
}

async function guardarEdicionEmpleado() {
  const id = document.getElementById("editarEmpleadoId").value;

  const empleado = {
    nombre: document.getElementById("editarNombreEmpleado").value.trim(),
    apellido: document.getElementById("editarApellidoEmpleado").value.trim(),
    dni: document.getElementById("editarDniEmpleado").value.trim(),
    telefono: document.getElementById("editarTelefonoEmpleado").value.trim(),
    email: document.getElementById("editarEmailEmpleado").value.trim(),
    cargo: document.getElementById("editarCargoEmpleado").value.trim(),
    fechaIngreso: document.getElementById("editarFechaIngresoEmpleado").value
  };

  if (
    !empleado.nombre ||
    !empleado.apellido ||
    !empleado.dni ||
    !empleado.cargo ||
    !empleado.fechaIngreso
  ) {
    Swal.fire(
      "Datos incompletos",
      "Completá todos los campos obligatorios.",
      "warning"
    );
    return;
  }

  try {
    const response = await fetch(`${API}/empleados/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(empleado)
    });

    const resultado = await response.json();

    if (!response.ok) {
      throw new Error(resultado.message || "Error al editar empleado");
    }

    Swal.fire(
      "Empleado actualizado",
      "Los datos fueron actualizados correctamente.",
      "success"
    );

    bootstrap.Modal.getInstance(
      document.getElementById("modalEditarEmpleado")
    )?.hide();

    cargarEmpleados();
  } catch (error) {
    Swal.fire(
      "Error",
      error.message || "No se pudo actualizar el empleado.",
      "error"
    );
  }
}

async function eliminarEmpleado(id) {
  const confirmacion = await Swal.fire({
    title: "¿Desactivar empleado?",
    text: "El empleado dejará de aparecer entre los empleados activos.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, desactivar",
    cancelButtonText: "Cancelar"
  });

  if (!confirmacion.isConfirmed) return;

  try {
    const response = await fetch(`${API}/empleados/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const resultado = await response.json();
      throw new Error(resultado.message || "Error al desactivar empleado");
    }

    Swal.fire(
      "Empleado desactivado",
      "El empleado fue desactivado correctamente.",
      "success"
    );

    cargarEmpleados();
  } catch (error) {
    Swal.fire(
      "Error",
      error.message || "No se pudo desactivar el empleado.",
      "error"
    );
  }
}

async function mostrarEmpleadosInactivos() {
  try {
    const res = await fetch(`${API}/empleados/inactivos`);

    if (!res.ok) {
      throw new Error("No se pudieron cargar los empleados inactivos.");
    }

    const lista = await res.json();
    const contenedor = document.getElementById("empleadosInactivos");

    if (!contenedor) {
      throw new Error("No existe el contenedor de empleados inactivos");
    }

    contenedor.innerHTML = "";

    if (!lista.length) {
      contenedor.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info mb-0">
            No existen empleados inactivos.
          </div>
        </div>
      `;
    } else {
      lista.forEach(empleado => {
        contenedor.innerHTML += `
          <div class="col-md-6 col-lg-4">
            <div class="card border-danger shadow-sm h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <h5 class="fw-bold mb-0">
                    ${escapeHtml(empleado.nombre)} ${escapeHtml(empleado.apellido)}
                  </h5>
                  <span class="badge bg-danger">Inactivo</span>
                </div>

                <p class="mb-2">
                  <strong>DNI:</strong> ${escapeHtml(empleado.dni)}
                </p>

                <p class="mb-2">
                  <strong>Cargo:</strong> ${escapeHtml(empleado.cargo)}
                </p>

                <p class="mb-3">
                  <strong>Email:</strong> ${escapeHtml(empleado.email || "Sin email")}
                </p>

                ${esAdmin() ? `
                  <button
                    class="btn btn-success w-100"
                    onclick="reactivarEmpleado(${empleado.id})">
                    <i class="bi bi-arrow-counterclockwise me-1"></i>
                    Reactivar
                  </button>
                ` : ""}
              </div>
            </div>
          </div>
        `;
      });
    }

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("modalEmpleadosInactivos")
    ).show();

  } catch (error) {
    alertaError(error.message);
  }
}

async function reactivarEmpleado(id) {
  const confirmacion = await Swal.fire({
    title: "¿Reactivar empleado?",
    text: "El empleado volverá a aparecer entre los empleados activos.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, reactivar",
    cancelButtonText: "Cancelar"
  });

  if (!confirmacion.isConfirmed) return;

  try {
    const response = await fetch(`${API}/empleados/${id}/reactivar`, {
      method: "PATCH"
    });

    if (!response.ok) {
      const resultado = await response.json();
      throw new Error(resultado.message || "Error al reactivar empleado");
    }

    Swal.fire(
      "Empleado reactivado",
      "El empleado fue reactivado correctamente.",
      "success"
    );

    bootstrap.Modal.getInstance(
      document.getElementById("modalEmpleadosInactivos")
    )?.hide();

    cargarEmpleados();
  } catch (error) {
    Swal.fire(
      "Error",
      error.message || "No se pudo reactivar el empleado.",
      "error"
    );
  }
}
document.getElementById("buscarEmpleado")?.addEventListener("input", () => {
  paginaEmpleados = 1;
  cargarEmpleados();
});
async function cargarProveedores() {
  try {
    const texto = document.getElementById("buscarProveedor")?.value.trim() || "";

    const params = new URLSearchParams({
      page: paginaProveedores,
      limit: limiteProveedores
    });

    if (texto) {
      params.append("buscar", texto);
    }

    const res = await fetch(`${API}/proveedores?${params.toString()}`);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "No se pudieron cargar los proveedores.");
    }

    const resultado = await res.json();

    proveedores = resultado.data || [];

    renderProveedores(resultado);
  } catch (error) {
    alertaError(error.message || "Error al cargar proveedores.");
  }
}

function renderProveedores(resultado) {
  const contenedor = document.getElementById("listaProveedores");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!proveedores.length) {
    contenedor.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info">
          No se encontraron proveedores.
        </div>
      </div>
    `;

    renderPaginacionProveedores(resultado);
    return;
  }

  proveedores.forEach(proveedor => {
    contenedor.innerHTML += `
      <div class="col-lg-4 col-md-6">
        <div class="card border-0 shadow h-100">
          <div class="card-body">

            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 class="fw-bold mb-1">
                  <i class="bi bi-truck me-2"></i>
                  ${escapeHtml(proveedor.nombre)}
                </h5>

                <span class="badge bg-success">
                  Activo
                </span>
              </div>

              <span class="badge bg-primary">
                ID ${proveedor.id}
              </span>
            </div>

            <p class="mb-2">
              <strong>CUIT:</strong>
              ${escapeHtml(proveedor.cuit)}
            </p>

            <p class="mb-2">
              <strong>Teléfono:</strong>
              ${escapeHtml(proveedor.telefono || "Sin teléfono")}
            </p>

            <p class="mb-2">
              <strong>Email:</strong>
              ${escapeHtml(proveedor.email || "Sin email")}
            </p>

            <p class="mb-3">
              <strong>Dirección:</strong>
              ${escapeHtml(proveedor.direccion || "Sin dirección")}
            </p>

            ${esAdmin()
        ? `
                  <div class="d-flex gap-2">
                    <button
                      class="btn btn-warning btn-sm flex-fill"
                      onclick="editarProveedor(${proveedor.id})">
                      <i class="bi bi-pencil me-1"></i>
                      Editar
                    </button>

                    <button
                      class="btn btn-danger btn-sm flex-fill"
                      onclick="eliminarProveedor(${proveedor.id})">
                      <i class="bi bi-trash me-1"></i>
                      Desactivar
                    </button>
                  </div>
                `
        : ""
      }

          </div>
        </div>
      </div>
    `;
  });

  renderPaginacionProveedores(resultado);
}

function renderPaginacionProveedores(resultado) {
  const contenedor = document.getElementById("paginacionProveedores");

  if (!contenedor) return;

  if (resultado.totalPages <= 1) {
    contenedor.innerHTML = "";
    return;
  }

  contenedor.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mt-4">

      <button
        class="btn btn-outline-secondary"
        ${resultado.page <= 1 ? "disabled" : ""}
        onclick="cambiarPaginaProveedores(${resultado.page - 1})">
        <i class="bi bi-chevron-left me-1"></i>
        Anterior
      </button>

      <span class="fw-bold">
        Página ${resultado.page} de ${resultado.totalPages}
      </span>

      <button
        class="btn btn-outline-secondary"
        ${resultado.page >= resultado.totalPages ? "disabled" : ""}
        onclick="cambiarPaginaProveedores(${resultado.page + 1})">
        Siguiente
        <i class="bi bi-chevron-right ms-1"></i>
      </button>

    </div>
  `;
}

function cambiarPaginaProveedores(pagina) {
  if (pagina < 1) return;

  paginaProveedores = pagina;
  cargarProveedores();
}

function abrirModalProveedor() {
  document.getElementById("nombreProveedor").value = "";
  document.getElementById("cuitProveedor").value = "";
  document.getElementById("telefonoProveedor").value = "";
  document.getElementById("emailProveedor").value = "";
  document.getElementById("direccionProveedor").value = "";

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("modalProveedor")
  ).show();
}

async function guardarProveedor() {
  if (!esAdmin()) {
    return alertaError("No tiene permisos para realizar esta acción.");
  }

  const proveedor = {
    nombre: document.getElementById("nombreProveedor").value.trim(),
    cuit: document.getElementById("cuitProveedor").value.trim(),
    telefono: document.getElementById("telefonoProveedor").value.trim(),
    email: document.getElementById("emailProveedor").value.trim(),
    direccion: document.getElementById("direccionProveedor").value.trim()
  };

  if (!proveedor.nombre || !proveedor.cuit) {
    return alertaError("Complete nombre y CUIT.");
  }

  try {
    const res = await fetch(`${API}/proveedores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(proveedor)
    });

    const resultado = await res.json();

    if (!res.ok) {
      throw new Error(
        Array.isArray(resultado.message)
          ? resultado.message.join(" ")
          : resultado.message || "No se pudo crear el proveedor."
      );
    }

    alertaExito("Proveedor registrado");

    bootstrap.Modal.getInstance(
      document.getElementById("modalProveedor")
    )?.hide();

    paginaProveedores = 1;
    await cargarProveedores();
  } catch (error) {
    alertaError(error.message);
  }
}

async function editarProveedor(id) {
  try {
    const res = await fetch(`${API}/proveedores/${id}`);

    if (!res.ok) {
      throw new Error("No se pudo obtener el proveedor.");
    }

    const proveedor = await res.json();

    document.getElementById("editarProveedorId").value = proveedor.id;
    document.getElementById("editarNombreProveedor").value = proveedor.nombre || "";
    document.getElementById("editarCuitProveedor").value = proveedor.cuit || "";
    document.getElementById("editarTelefonoProveedor").value = proveedor.telefono || "";
    document.getElementById("editarEmailProveedor").value = proveedor.email || "";
    document.getElementById("editarDireccionProveedor").value = proveedor.direccion || "";

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("modalEditarProveedor")
    ).show();
  } catch (error) {
    alertaError(error.message);
  }
}

async function guardarEdicionProveedor() {
  const id = Number(
    document.getElementById("editarProveedorId").value
  );

  const proveedor = {
    nombre: document.getElementById("editarNombreProveedor").value.trim(),
    cuit: document.getElementById("editarCuitProveedor").value.trim(),
    telefono: document.getElementById("editarTelefonoProveedor").value.trim(),
    email: document.getElementById("editarEmailProveedor").value.trim(),
    direccion: document.getElementById("editarDireccionProveedor").value.trim()
  };

  if (!id || !proveedor.nombre || !proveedor.cuit) {
    return alertaError("Complete nombre y CUIT.");
  }

  try {
    const res = await fetch(`${API}/proveedores/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(proveedor)
    });

    const resultado = await res.json();

    if (!res.ok) {
      throw new Error(
        Array.isArray(resultado.message)
          ? resultado.message.join(" ")
          : resultado.message || "No se pudo actualizar el proveedor."
      );
    }

    alertaExito("Proveedor actualizado");

    bootstrap.Modal.getInstance(
      document.getElementById("modalEditarProveedor")
    )?.hide();

    await cargarProveedores();
  } catch (error) {
    alertaError(error.message);
  }
}

async function eliminarProveedor(id) {
  const ok = await confirmar(
    "¿Desactivar proveedor?",
    "El proveedor dejará de aparecer entre los proveedores activos."
  );

  if (!ok) return;

  try {
    const res = await fetch(`${API}/proveedores/${id}`, {
      method: "DELETE"
    });

    const resultado = await res.json();

    if (!res.ok) {
      throw new Error(
        resultado.message || "No se pudo desactivar el proveedor."
      );
    }

    alertaExito("Proveedor desactivado");

    await cargarProveedores();
  } catch (error) {
    alertaError(error.message);
  }
}

async function mostrarProveedoresInactivos() {
  try {
    const res = await fetch(`${API}/proveedores/inactivos`);

    if (!res.ok) {
      throw new Error("No se pudieron cargar los proveedores inactivos.");
    }

    const lista = await res.json();

    const contenedor =
      document.getElementById("proveedoresInactivos");

    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!lista.length) {
      contenedor.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info mb-0">
            No existen proveedores inactivos.
          </div>
        </div>
      `;
    } else {
      lista.forEach(proveedor => {
        contenedor.innerHTML += `
          <div class="col-lg-4 col-md-6 mb-3">
            <div class="card border-danger shadow-sm h-100">
              <div class="card-body">

                <div class="d-flex justify-content-between align-items-start mb-3">
                  <h5 class="fw-bold mb-0">
                    <i class="bi bi-truck me-2"></i>
                    ${escapeHtml(proveedor.nombre)}
                  </h5>

                  <span class="badge bg-danger">
                    Inactivo
                  </span>
                </div>

                <p class="mb-2">
                  <strong>CUIT:</strong>
                  ${escapeHtml(proveedor.cuit)}
                </p>

                <p class="mb-2">
                  <strong>Teléfono:</strong>
                  ${escapeHtml(proveedor.telefono || "Sin teléfono")}
                </p>

                <p class="mb-3">
                  <strong>Email:</strong>
                  ${escapeHtml(proveedor.email || "Sin email")}
                </p>

                ${esAdmin()
            ? `
                      <button
                        class="btn btn-success w-100"
                        onclick="reactivarProveedor(${proveedor.id})">
                        <i class="bi bi-arrow-counterclockwise me-1"></i>
                        Reactivar
                      </button>
                    `
            : ""
          }

              </div>
            </div>
          </div>
        `;
      });
    }

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("modalProveedoresInactivos")
    ).show();
  } catch (error) {
    alertaError(error.message);
  }
}

async function reactivarProveedor(id) {
  const ok = await confirmar(
    "¿Reactivar proveedor?",
    "El proveedor volverá a aparecer entre los proveedores activos."
  );

  if (!ok) return;

  try {
    const res = await fetch(
      `${API}/proveedores/${id}/reactivar`,
      {
        method: "PATCH"
      }
    );

    const resultado = await res.json();

    if (!res.ok) {
      throw new Error(
        resultado.message || "No se pudo reactivar el proveedor."
      );
    }

    alertaExito("Proveedor reactivado");

    await cargarProveedores();

    bootstrap.Modal.getInstance(
      document.getElementById("modalProveedoresInactivos")
    )?.hide();
  } catch (error) {
    alertaError(error.message);
  }
}
async function cargarMovimientosStock() {
  try {
    const buscar =
      document.getElementById("buscarMovimientoStock")?.value.trim() || "";

    const tipo =
      document.getElementById("tipoMovimientoStock")?.value || "";

    const desde =
      document.getElementById("movimientoDesde")?.value || "";

    const hasta =
      document.getElementById("movimientoHasta")?.value || "";

    const params = new URLSearchParams({
      page: paginaMovimientosStock,
      limit: limiteMovimientosStock
    });

    if (buscar) {
      params.append("buscar", buscar);
    }

    if (tipo) {
      params.append("tipo", tipo);
    }

    if (desde) {
      params.append("desde", desde);
    }

    if (hasta) {
      params.append("hasta", hasta);
    }

    const res = await fetch(
      `${API}/movimientos-stock?${params.toString()}`
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        error.message || "No se pudieron cargar los movimientos."
      );
    }

    const resultado = await res.json();

    movimientosStock = resultado.data || [];

    renderMovimientosStock(resultado);
  } catch (error) {
    alertaError(
      error.message || "Error al cargar movimientos de stock."
    );
  }
}

function renderMovimientosStock(resultado) {
  const contenedor =
    document.getElementById("listaMovimientosStock");

  if (!contenedor) return;

  if (!movimientosStock.length) {
    contenedor.innerHTML = `
      <div class="card border-0 shadow-lg">
        <div class="card-body">
          <div class="alert alert-info mb-0">
            No se encontraron movimientos de stock.
          </div>
        </div>
      </div>
    `;

    renderPaginacionMovimientosStock(resultado);
    return;
  }

  contenedor.innerHTML = `
    <div class="card border-0 shadow-lg">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Empleado</th>
                <th>Proveedor</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              ${movimientosStock.map(movimiento => {
    let badgeTipo = "secondary";
    let textoTipo = movimiento.tipo;

    if (movimiento.tipo === "entrada") {
      badgeTipo = "success";
      textoTipo = "Entrada";
    }

    if (movimiento.tipo === "salida") {
      badgeTipo = "danger";
      textoTipo = "Salida";
    }

    if (movimiento.tipo === "ajuste") {
      badgeTipo = "warning";
      textoTipo = "Ajuste";
    }

    const empleado = movimiento.empleado
      ? `${movimiento.empleado.nombre} ${movimiento.empleado.apellido}`
      : "Sin empleado";

    const proveedor = movimiento.proveedor
      ? movimiento.proveedor.nombre
      : "Sin proveedor";

    return `
                  <tr>
                    <td>
                      ${formatearFechaMovimientoStock(movimiento.fecha)}
                    </td>
                    <td>
                      <strong>
                        ${escapeHtml(
      movimiento.producto?.nombre ||
      "Producto eliminado"
    )}
                      </strong>
                    </td>
                    <td>
                      <span class="badge bg-${badgeTipo}">
                        ${textoTipo}
                      </span>
                    </td>
                    <td>
                      <strong>${movimiento.cantidad}</strong>
                    </td>
                    <td>${escapeHtml(empleado)}</td>
                    <td>${escapeHtml(proveedor)}</td>
                    <td>
                      ${escapeHtml(movimiento.motivo || "Sin motivo")}
                    </td>
                  </tr>
                `;
  }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  renderPaginacionMovimientosStock(resultado);
}

function renderPaginacionMovimientosStock(resultado) {
  const contenedor =
    document.getElementById("paginacionMovimientosStock");

  if (!contenedor) return;

  if (resultado.totalPages <= 1) {
    contenedor.innerHTML = "";
    return;
  }

  let html = `
    <div class="d-flex justify-content-center mt-4">

      <nav>

        <ul class="pagination">

          <li class="page-item ${resultado.page <= 1 ? "disabled" : ""
    }">

            <button
              class="page-link"
              onclick="cambiarPaginaMovimientosStock(${resultado.page - 1})">
              Anterior
            </button>

          </li>
  `;

  for (
    let i = 1;
    i <= resultado.totalPages;
    i++
  ) {
    html += `
      <li class="page-item ${i === resultado.page ? "active" : ""
      }">

        <button
          class="page-link"
          onclick="cambiarPaginaMovimientosStock(${i})">
          ${i}
        </button>

      </li>
    `;
  }

  html += `
          <li class="page-item ${resultado.page >= resultado.totalPages
      ? "disabled"
      : ""
    }">

            <button
              class="page-link"
              onclick="cambiarPaginaMovimientosStock(${resultado.page + 1})">
              Siguiente
            </button>

          </li>

        </ul>

      </nav>

    </div>
  `;

  contenedor.innerHTML = html;
}

function cambiarPaginaMovimientosStock(pagina) {
  if (pagina < 1) return;

  paginaMovimientosStock = pagina;

  cargarMovimientosStock();
}

function formatearFechaMovimientoStock(fecha) {
  if (!fecha) return "-";

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return fecha;
  }

  return date.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

async function abrirModalMovimientoStock() {
  if (!esAdmin()) {
    return alertaError("No tiene permisos para realizar esta acción.");
  }

  [
    "productoMovimientoStock",
    "empleadoMovimientoStock",
    "proveedorMovimientoStock"
  ].forEach(id => {
    const select = document.getElementById(id);
    if (select) select.selectedIndex = 0;
  });

  document.getElementById("tipoNuevoMovimientoStock").value = "";
  document.getElementById("cantidadMovimientoStock").value = "";
  document.getElementById("motivoMovimientoStock").value = "";

  try {
    const productosRes = await fetch(`${API}/productos/todos`);
    const empleadosRes = await fetch(`${API}/empleados?page=1&limit=100`);

    if (!productosRes.ok || !empleadosRes.ok) {
      throw new Error("No se pudieron cargar los datos del movimiento.");
    }

    const productosLista = await productosRes.json();
    const empleadosResultado = await empleadosRes.json();

    const selectProducto = document.getElementById("productoMovimientoStock");
    const selectEmpleado = document.getElementById("empleadoMovimientoStock");

    selectProducto.innerHTML = `<option value="">Seleccionar producto</option>`;
    selectEmpleado.innerHTML = `<option value="">Seleccionar empleado</option>`;

    productosLista.filter(producto => producto.activo).forEach(producto => {
      selectProducto.innerHTML += `
        <option value="${producto.id}">
          ${escapeHtml(producto.nombre)} - Stock: ${producto.stock}
        </option>
      `;
    });

    (empleadosResultado.data || []).forEach(empleado => {
      selectEmpleado.innerHTML += `
        <option value="${empleado.id}">
          ${escapeHtml(`${empleado.nombre} ${empleado.apellido}`)}
        </option>
      `;
    });

    await cargarOpcionesProducto();

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("modalMovimientoStock")
    ).show();
  } catch (error) {
    alertaError(error.message);
  }
}
async function guardarMovimientoStock() {
  if (!esAdmin()) {
    return alertaError("No tiene permisos para realizar esta acción.");
  }

  const productoId = Number(document.getElementById("productoMovimientoStock").value);
  const empleadoId = Number(document.getElementById("empleadoMovimientoStock").value);
  const proveedorValor = document.getElementById("proveedorMovimientoStock").value;
  const proveedorId = proveedorValor ? Number(proveedorValor) : null;
  const tipo = document.getElementById("tipoNuevoMovimientoStock").value;
  const cantidad = Number(document.getElementById("cantidadMovimientoStock").value);
  const motivo = document.getElementById("motivoMovimientoStock").value.trim();

  if (!productoId) return alertaError("Seleccione un producto.");
  if (!empleadoId) return alertaError("Seleccione un empleado.");
  if (!tipo) return alertaError("Seleccione el tipo de movimiento.");
  if (Number.isNaN(cantidad) || cantidad <= 0) {
    return alertaError("Ingrese una cantidad válida.");
  }
  if (tipo === "entrada" && !proveedorId) {
    return alertaError("Seleccione el proveedor para la entrada de stock.");
  }

  try {
    const res = await fetch(`${API}/movimientos-stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productoId,
        empleadoId,
        proveedorId,
        tipo,
        cantidad,
        motivo
      })
    });

    const resultado = await res.json();

    if (!res.ok) {
      throw new Error(
        Array.isArray(resultado.message)
          ? resultado.message.join(" ")
          : resultado.message || "No se pudo registrar el movimiento."
      );
    }

    alertaExito("Movimiento registrado");

    bootstrap.Modal.getInstance(
      document.getElementById("modalMovimientoStock")
    )?.hide();

    paginaMovimientosStock = 1;

    await cargarMovimientosStock();
    await cargarProductos();
    await cargarProductosVenta();
    cargarDashboard();
  } catch (error) {
    alertaError(error.message);
  }
}
document.getElementById("buscarProveedor")?.addEventListener("input", () => {
  paginaProveedores = 1;
  cargarProveedores();
});
document.getElementById("tipoMovimientoStock")?.addEventListener("change", () => {
  paginaMovimientosStock = 1;
  cargarMovimientosStock();
});

async function cargarDevoluciones() {
  const tabla = document.getElementById("tablaDevoluciones");

  if (!tabla) return;

  tabla.innerHTML = `
    <tr>
      <td colspan="7" class="text-center text-muted">
        Cargando devoluciones...
      </td>
    </tr>
  `;

  try {
    const res = await fetch(`${API}/devoluciones-venta`);

    if (!res.ok) {
      throw new Error("No se pudieron cargar las devoluciones.");
    }

    const resultado = await res.json();

    const devoluciones = Array.isArray(resultado)
      ? resultado
      : resultado.data || [];

    if (!devoluciones.length) {
      tabla.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted">
            Todavía no hay devoluciones registradas.
          </td>
        </tr>
      `;
      return;
    }

    tabla.innerHTML = "";

    devoluciones.forEach(devolucion => {
      const fecha = devolucion.fecha
        ? new Date(devolucion.fecha).toLocaleDateString("es-AR")
        : "-";

      const ventaId =
        devolucion.venta?.id ??
        devolucion.ventaId ??
        "-";

      const importe = Number(
        devolucion.monto ?? devolucion.total ?? 0
      );

      const tipo = devolucion.tipoCredito ?? devolucion.tipo ?? "-";
      const estado = devolucion.estado ?? "-";
      const motivo = devolucion.motivo ?? "-";

      let colorEstado = "secondary";

      if (estado === "completada" || estado === "completado") {
        colorEstado = "success";
      } else if (estado === "pendiente") {
        colorEstado = "warning";
      }

      const botonReintegro =
        tipo === "reintegro" && estado === "pendiente"
          ? `
            <button
              class="btn btn-success btn-sm"
              onclick="confirmarReintegro(${devolucion.id})">
              <i class="bi bi-check-circle me-1"></i>
              Confirmar reintegro
            </button>
          `
          : "";

      tabla.innerHTML += `
        <tr>
          <td>${escapeHtml(fecha)}</td>
          <td>#${escapeHtml(String(ventaId))}</td>
          <td>
            $${importe.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}
          </td>
          <td>${escapeHtml(String(tipo))}</td>
          <td>
            <span class="badge bg-${colorEstado}">
              ${escapeHtml(String(estado))}
            </span>
          </td>
          <td>${escapeHtml(String(motivo))}</td>
          <td>${botonReintegro || "-"}</td>
        </tr>
      `;
    });
  } catch (error) {
    tabla.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}
async function confirmarReintegro(id) {
  const ok = await confirmar(
    "¿Confirmar reintegro?",
    "Esta acción marcará el reintegro como completado."
  );

  if (!ok) return;

  try {
    const res = await fetch(
      `${API}/devoluciones-venta/${id}/confirmar-reintegro`,
      {
        method: "PATCH"
      }
    );

    const resultado = await res.json();

    if (!res.ok) {
      throw new Error(
        Array.isArray(resultado.message)
          ? resultado.message.join(" ")
          : resultado.message || "No se pudo confirmar el reintegro."
      );
    }

    alertaExito("Reintegro confirmado");

    await cargarDevoluciones();
    await cargarDashboard();
  } catch (error) {
    alertaError(error.message);
  }
}


let ventasDisponiblesDevolucion = [];

async function abrirModalDevolucion() {
  if (!esAdmin()) {
    return alertaError("No tiene permisos para registrar devoluciones.");
  }

  const ventaSelect = document.getElementById("ventaDevolucion");
  const buscador = document.getElementById("buscarVentaDevolucion");
  const empleadoSelect = document.getElementById("empleadoDevolucion");
  const productosContenedor = document.getElementById("productosDevolucion");
  const motivoInput = document.getElementById("motivoDevolucion");

  if (!ventaSelect || !buscador || !empleadoSelect || !productosContenedor) {
    return alertaError("Faltan campos del formulario de devoluciones en index.html.");
  }

  ventaSelect.innerHTML = '<option value="">Cargando ventas...</option>';
  empleadoSelect.innerHTML = '<option value="">Cargando empleados...</option>';
  productosContenedor.innerHTML = '<p class="text-muted">Seleccione una venta.</p>';
  buscador.value = "";
  if (motivoInput) motivoInput.value = "";

  const tipoCredito = document.getElementById("tipoCreditoDevolucion");
  if (tipoCredito) tipoCredito.value = "";

  detallesVentaDevolucion = [];
  ventasDisponiblesDevolucion = [];

  try {
    // Obtener todas las páginas de ventas.
    let pagina = 1;
    let totalPaginas = 1;

    do {
      const res = await fetch(`${API}/ventas?page=${pagina}&limit=100`);

      if (!res.ok) {
        throw new Error("No se pudieron cargar las ventas.");
      }

      const resultado = await res.json();
      const ventas = Array.isArray(resultado) ? resultado : resultado.data || [];

      ventasDisponiblesDevolucion.push(
        ...ventas.filter(venta => venta.estado === "confirmada")
      );

      totalPaginas = Array.isArray(resultado)
        ? 1
        : Number(resultado.totalPages || 1);

      pagina++;
    } while (pagina <= totalPaginas);

    // Cargar empleados.
    const resEmpleados = await fetch(`${API}/empleados?page=1&limit=100`);

    if (!resEmpleados.ok) {
      throw new Error("No se pudieron cargar los empleados.");
    }

    const resultadoEmpleados = await resEmpleados.json();
    const listaEmpleados = (
      Array.isArray(resultadoEmpleados)
        ? resultadoEmpleados
        : resultadoEmpleados.data || []
    ).filter(empleado => empleado.activo !== false);

    empleadoSelect.innerHTML =
      '<option value="">Seleccione un empleado</option>';

    listaEmpleados.forEach(empleado => {
      const opcion = document.createElement("option");
      opcion.value = empleado.id;
      opcion.textContent = `${empleado.nombre} ${empleado.apellido}`;
      empleadoSelect.appendChild(opcion);
    });

    function filtrarVentasDevolucion() {
      const texto = buscador.value.trim().toLowerCase();

      const ventasFiltradas = ventasDisponiblesDevolucion.filter(venta => {
        const cliente = venta.cliente
          ? `${venta.cliente.nombre || ""} ${venta.cliente.apellido || ""}`
          : "sin cliente";

        return (
          String(venta.id).includes(texto) ||
          cliente.toLowerCase().includes(texto)
        );
      });

      ventaSelect.innerHTML = '<option value="">Seleccione una venta</option>';

      ventasFiltradas.forEach(venta => {
        const opcion = document.createElement("option");
        opcion.value = venta.id;

        const cliente = venta.cliente
          ? `${venta.cliente.nombre || ""} ${venta.cliente.apellido || ""}`.trim()
          : "Sin cliente";

        opcion.textContent =
          `Venta #${venta.id} - ${cliente} - $${Number(venta.total || 0).toFixed(2)}`;

        ventaSelect.appendChild(opcion);
      });
    }

    buscador.oninput = filtrarVentasDevolucion;
    ventaSelect.onchange = cargarDetallesVentaDevolucion;

    filtrarVentasDevolucion();

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("modalDevolucion")
    ).show();
  } catch (error) {
    alertaError(error.message || "Error al abrir devoluciones.");
  }
}

async function cargarDetallesVentaDevolucion() {
  const ventaId = Number(
    document.getElementById("ventaDevolucion")?.value
  );
  const contenedor = document.getElementById("productosDevolucion");

  if (!contenedor) return;

  detallesVentaDevolucion = [];

  if (!ventaId) {
    contenedor.innerHTML =
      '<p class="text-muted">Seleccione una venta.</p>';
    return;
  }

  contenedor.innerHTML =
    '<p class="text-muted">Cargando productos...</p>';

  try {
    const res = await fetch(`${API}/ventas/${ventaId}`);

    if (!res.ok) {
      throw new Error("No se pudieron cargar los detalles de la venta.");
    }

    const venta = await res.json();

    const detalles = venta.detalles || [];

    if (!detalles.length) {
      contenedor.innerHTML =
        '<p class="text-muted">La venta no tiene productos.</p>';
      return;
    }

    detallesVentaDevolucion = detalles;

    contenedor.innerHTML = detalles.map(detalle => `
      <div class="row align-items-center border-bottom py-2">
        <div class="col-md-7">
          <strong>${escapeHtml(detalle.producto?.nombre || "Producto")}</strong>
          <div class="small text-muted">
            Vendidos: ${Number(detalle.cantidad)}
          </div>
        </div>
        <div class="col-md-5">
          <label class="form-label">Cantidad a devolver</label>
          <input
            type="number"
            class="form-control cantidad-devolucion"
            data-detalle-id="${detalle.id}"
            min="0"
            max="${Number(detalle.cantidad)}"
            step="1"
            value="0"
          >
        </div>
      </div>
    `).join("");
  } catch (error) {
    contenedor.innerHTML =
      '<p class="text-danger">Error al cargar los productos.</p>';
    alertaError(error.message);
  }
}

async function guardarDevolucion() {
  if (!esAdmin()) {
    return alertaError(
      "No tiene permisos para registrar devoluciones."
    );
  }

  const ventaId = Number(
    document.getElementById("ventaDevolucion")?.value
  );
  const tipoCredito = document.getElementById(
    "tipoCreditoDevolucion"
  )?.value;
  const motivo = document.getElementById(
    "motivoDevolucion"
  )?.value.trim() || "";

  const empleadoId = Number(
    document.getElementById("empleadoDevolucion")?.value || 0
  );

  if (!empleadoId) {
    return alertaError("Seleccione el empleado responsable de la devolución.");
  }

  const productos = Array.from(
    document.querySelectorAll(".cantidad-devolucion")
  )
    .map(input => ({
      detalleVentaId: Number(input.dataset.detalleId),
      cantidad: Number(input.value)
    }))
    .filter(item => item.cantidad > 0);

  if (!ventaId) {
    return alertaError("Seleccione una venta.");
  }

  if (!["saldo_favor", "reintegro"].includes(tipoCredito)) {
    return alertaError("Seleccione un tipo de crédito válido.");
  }

  if (!productos.length) {
    return alertaError(
      "Ingrese al menos una cantidad para devolver."
    );
  }

  if (productos.some(item =>
    !Number.isInteger(item.cantidad) || item.cantidad < 1
  )) {
    return alertaError(
      "Las cantidades deben ser números enteros positivos."
    );
  }

  for (const item of productos) {
    const detalle = detallesVentaDevolucion.find(
      d => Number(d.id) === item.detalleVentaId
    );

    if (!detalle || item.cantidad > Number(detalle.cantidad)) {
      return alertaError(
        "Revise las cantidades ingresadas para la devolución."
      );
    }
  }

  try {
    const res = await fetch(`${API}/devoluciones-venta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ventaId,
        empleadoId: empleadoId || undefined,
        tipoCredito,
        motivo,
        productos
      })
    });

    const resultado = await res.json();

    if (!res.ok) {
      throw new Error(
        Array.isArray(resultado.message)
          ? resultado.message.join(" ")
          : resultado.message || "No se pudo registrar la devolución."
      );
    }

    bootstrap.Modal.getInstance(
      document.getElementById("modalDevolucion")
    )?.hide();

    alertaExito(
      "Devolución registrada",
      `Importe devuelto: $${Number(resultado.total || 0).toFixed(2)}`
    );

    await cargarDevoluciones();
    await cargarProductos();
    await cargarProductosVenta();
    await cargarMovimientosStock();
    await cargarDashboard();
  } catch (error) {
    alertaError(error.message || "Error al registrar la devolución.");
  }
}
