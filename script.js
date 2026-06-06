const SPREADSHEET_ID = '1TeoYLaV7noS0VdzAKAt19vpUaJ7eL5G30Nc8r_EtHts';
// CAMBIO CLAVE: format=tsv en lugar de format=csv
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=tsv`;
const WHATSAPP_NUMERO = '5355030077'; // Tu número de WhatsApp real

window.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
});

async function cargarProductos() {
    try {
        const respuesta = await fetch(SHEET_URL);
        if (!respuesta.ok) throw new Error('No se pudo conectar con la base de datos');
        
        const textoTSV = await respuesta.text();
        const productos = parsearTSV(textoTSV);
        
        inyectarProductosEnLaWeb(productos);
    } catch (error) {
        console.error('Error al cargar catálogo:', error);
    }
}

// NUEVA FUNCIÓN: Procesa tabulaciones, 100% libre de errores con espacios o comas
function parsearTSV(texto) {
    const lineas = texto.split(/\r?\n/);
    const resultado = [];
    
    // Separamos estrictamente por el carácter de tabulación (\t)
    const cabeceras = lineas[0].split('\t').map(c => c.trim());
    
    for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;
        
        const celdas = linea.split('\t');
        const producto = {};
        
        cabeceras.forEach((cabecera, indice) => {
            producto[cabecera] = celdas[indice] ? celdas[indice].trim() : '';
        });
        
        resultado.push(producto);
    }
    return resultado;
}

function inyectarProductosEnLaWeb(listaProductos) {
    // Limpiamos los contenedores por si Live Server recarga la página dos veces
    document.getElementById('grid-masculina').innerHTML = '';
    document.getElementById('grid-femenina').innerHTML = '';
    document.getElementById('grid-moda').innerHTML = '';
    document.getElementById('grid-apple').innerHTML = '';

    listaProductos.forEach(producto => {
        if (!producto.nombre || !producto.categoria) return; 

        const card = document.createElement('div');
        card.classList.add('producto-card');
        
        const mensajeWhatsApp = encodeURIComponent(`Hola D'Morales, estoy interesado en el producto: *${producto.nombre}* con precio de *${producto.precio} CUP*. ¿Tienen disponibilidad?`);
        const enlaceWhatsApp = `https://wa.me/${WHATSAPP_NUMERO}?text=${mensajeWhatsApp}`;
        
        // Imagen por defecto si la celda de la foto está vacía
        const imagenValida = producto.imagen_url ? producto.imagen_url : 'https://picsum.photos/300/400';

        card.innerHTML = `
            <img class="producto-imagen" src="${imagenValida}" alt="${producto.nombre}" loading="lazy" onerror="this.src='https://picsum.photos/300/400';">
            <div class="producto-info">
                <h3 class="producto-nombre">${producto.nombre}</h3>
                <p class="producto-descripcion">${producto.descripcion}</p>
                <p class="producto-precio">${producto.precio} CUP</p>
                <a href="${enlaceWhatsApp}" target="_blank" class="btn-whatsapp">Encargar por WhatsApp</a>
            </div>
        `;
        
        let contenedorGrid;
        if (producto.categoria === 'ropa-masculina') contenedorGrid = document.getElementById('grid-masculina');
        else if (producto.categoria === 'ropa-femenina') contenedorGrid = document.getElementById('grid-femenina');
        else if (producto.categoria === 'accesorios-moda') contenedorGrid = document.getElementById('grid-moda');
        else if (producto.categoria === 'accesorios-apple') contenedorGrid = document.getElementById('grid-apple');
        
        if (contenedorGrid) {
            contenedorGrid.appendChild(card);
        }
    });
}

