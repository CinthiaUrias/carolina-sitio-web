
const API_URL = "api/productos.php";

let productos = [];

const formulario = document.getElementById("formProducto");
const listaProductos = document.getElementById("listaProductos");
const busqueda = document.getElementById("busqueda");
const filtroCategoria = document.getElementById("filtroCategoria");

const productoId = document.getElementById("productoId");
const nombre = document.getElementById("nombre");
const categoria = document.getElementById("categoria");
const descripcion = document.getElementById("descripcion");
const precio = document.getElementById("precio");

const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const btnActualizar = document.getElementById("btnActualizar");

const mensajeEstado = document.getElementById("mensajeEstado");

// Formato de moneda mexicana
const formatoMoneda = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
});

// Fecha actual
document.getElementById("fechaActual").textContent =
    new Date().toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

// Función para escapar texto HTML
function escaparHTML(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caracter => {
        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entidades[caracter];
    });
}

// Comunicación asíncrona con el servidor
async function solicitarAPI(metodo = "GET", datos = null, id = null) {
    let url = API_URL;

    if (id !== null) {
        url += "?id=" + encodeURIComponent(id);
    }

    const opciones = {
        method: metodo,
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (datos !== null) {
        opciones.body = JSON.stringify(datos);
    }

    const respuesta = await fetch(url, opciones);

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(resultado.error || "Ocurrió un error en el servidor.");
    }

    return resultado;
}

// Consultar productos registrados
async function cargarProductos() {
    mensajeEstado.textContent = "Consultando información del servidor...";

    try {
        const resultado = await solicitarAPI("GET");

        if (!Array.isArray(resultado)) {
            throw new Error("El servidor no devolvió una lista válida.");
        }

        productos = resultado;

        mostrarProductos();
        actualizarResumen();

        mensajeEstado.textContent =
            productos.length + " producto(s) registrado(s).";

    } catch (error) {
        mensajeEstado.textContent = "No fue posible cargar los productos.";

        Swal.fire({
            icon: "error",
            title: "Error de conexión",
            text: error.message
        });
    }
}

// Mostrar productos en la página
function mostrarProductos() {
    const texto = busqueda.value.toLowerCase().trim();
    const categoriaSeleccionada = filtroCategoria.value;

    const productosFiltrados = productos.filter(producto => {
        const coincideNombre = String(producto.nombre)
            .toLowerCase()
            .includes(texto);

        const coincideCategoria = categoriaSeleccionada === "" ||
            producto.categoria === categoriaSeleccionada;

        return coincideNombre && coincideCategoria;
    });

    listaProductos.innerHTML = "";

    if (productosFiltrados.length === 0) {
        listaProductos.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No se encontraron productos.
                </td>
            </tr>
        `;
        return;
    }

    productosFiltrados.forEach(producto => {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${escaparHTML(producto.id)}</td>
            <td><strong>${escaparHTML(producto.nombre)}</strong></td>
            <td>
                <span class="categoria-etiqueta">
                    ${escaparHTML(producto.categoria)}
                </span>
            </td>
            <td>${escaparHTML(producto.descripcion || "Sin descripción")}</td>
            <td>${formatoMoneda.format(Number(producto.precio))}</td>
            <td>
                <div class="acciones-tabla">
                    <button class="boton-editar" data-accion="editar"
                        data-id="${escaparHTML(producto.id)}">
                        Editar
                    </button>

                    <button class="boton-eliminar" data-accion="eliminar"
                        data-id="${escaparHTML(producto.id)}">
                        Eliminar
                    </button>
                </div>
            </td>
        `;

        listaProductos.appendChild(fila);
    });
}

// Actualizar los indicadores del inventario
function actualizarResumen() {
    const total = productos.length;

    const valor = productos.reduce((acumulado, producto) => {
        return acumulado + Number(producto.precio);
    }, 0);

    const categoriasRegistradas = new Set(
        productos.map(producto => producto.categoria).filter(Boolean)
    );

    document.getElementById("totalProductos").textContent = total;

    document.getElementById("valorInventario").textContent =
        formatoMoneda.format(valor);

    document.getElementById("totalCategorias").textContent =
        categoriasRegistradas.size;
}

// Registrar o actualizar productos
formulario.addEventListener("submit", async function(evento) {
    evento.preventDefault();

    if (!formulario.reportValidity()) {
        return;
    }

    const datosProducto = {
        nombre: nombre.value.trim(),
        categoria: categoria.value,
        descripcion: descripcion.value.trim(),
        precio: Number(precio.value)
    };

    if (!datosProducto.nombre || !datosProducto.categoria ||
        !Number.isFinite(datosProducto.precio) ||
        datosProducto.precio <= 0) {
        Swal.fire({
            icon: "warning",
            title: "Revisa los datos",
            text: "Completa los campos correctamente."
        });
        return;
    }

    const editando = productoId.value !== "";

    if (editando) {
        datosProducto.id = Number(productoId.value);
    }

    btnGuardar.disabled = true;

    try {
        await solicitarAPI(
            editando ? "PUT" : "POST",
            datosProducto
        );

        await cargarProductos();

        Swal.fire({
            icon: "success",
            title: editando ? "Producto actualizado" : "Producto registrado",
            text: "La información se guardó correctamente.",
            timer: 1800,
            showConfirmButton: false
        });

        limpiarFormulario();

    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "No se pudo guardar",
            text: error.message
        });
    } finally {
        btnGuardar.disabled = false;
    }
});

// Delegación de eventos para editar y eliminar
listaProductos.addEventListener("click", async function(evento) {
    const boton = evento.target.closest("button[data-accion]");

    if (!boton) {
        return;
    }

    const id = Number(boton.dataset.id);
    const accion = boton.dataset.accion;

    if (accion === "editar") {
        editarProducto(id);
    }

    if (accion === "eliminar") {
        await eliminarProducto(id);
    }
});

// Cargar datos en el formulario
function editarProducto(id) {
    const producto = productos.find(item => Number(item.id) === id);

    if (!producto) {
        return;
    }

    productoId.value = producto.id;
    nombre.value = producto.nombre;
    categoria.value = producto.categoria || "";
    descripcion.value = producto.descripcion || "";
    precio.value = producto.precio;

    document.getElementById("tituloFormulario").textContent =
        "Editar producto";

    btnGuardar.textContent = "Actualizar producto";
    btnCancelar.hidden = false;

    document.getElementById("formProducto").scrollIntoView({
        behavior: "smooth"
    });
}

// Eliminar un producto
async function eliminarProducto(id) {
    const producto = productos.find(item => Number(item.id) === id);

    if (!producto) {
        return;
    }

    const confirmacion = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar producto?",
        text: "Se eliminará " + producto.nombre + " del inventario.",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#e65a9b"
    });

    if (!confirmacion.isConfirmed) {
        return;
    }

    try {
        await solicitarAPI("DELETE", { id });

        await cargarProductos();

        Swal.fire({
            icon: "success",
            title: "Producto eliminado",
            text: "El registro se eliminó correctamente.",
            timer: 1600,
            showConfirmButton: false
        });

        if (Number(productoId.value) === id) {
            limpiarFormulario();
        }

    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "No se pudo eliminar",
            text: error.message
        });
    }
}

// Limpiar formulario
function limpiarFormulario() {
    formulario.reset();
    productoId.value = "";

    document.getElementById("tituloFormulario").textContent =
        "Agregar producto";

    btnGuardar.textContent = "Guardar producto";
    btnCancelar.hidden = true;
}

// Eventos de búsqueda y filtros
busqueda.addEventListener("input", mostrarProductos);

filtroCategoria.addEventListener("change", mostrarProductos);

btnActualizar.addEventListener("click", cargarProductos);

btnCancelar.addEventListener("click", limpiarFormulario);

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", cargarProductos);
