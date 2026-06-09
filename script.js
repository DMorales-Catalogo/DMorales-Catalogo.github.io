const SPREADSHEET_ID = '1TeoYLaV7noS0VdzAKAt19vpUaJ7eL5G30Nc8r_EtHts';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=tsv`;
const WHATSAPP_NUMERO = '5355030077'; 

window.addEventListener('DOMContentLoaded', () => {
    inicializarModal();
    cargarProductos();
});

function inicializarModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'modal-producto';
    modalOverlay.innerHTML = `
        <div class="modal-content">
            <button class="modal-cerrar">&times;</button>
            <div id="modal-body"></div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay || e.target.classList.contains('modal-cerrar')) {
            modalOverlay.classList.remove('activo');
        }
    });
}

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

function parsearTSV(texto) {
    const lineas = texto.split(/\r?\n/);
    const resultado = [];
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
    document.getElementById('grid-masculina').innerHTML = '';
    document.getElementById('grid-femenina').innerHTML = '';
    document.getElementById('grid-moda').innerHTML = '';
    document.getElementById('grid-apple').innerHTML = '';

    listaProductos.forEach(producto => {
        if (!producto.nombre || !producto.categoria) return; 

        const card = document.createElement('div');
        card.classList.add('producto-card');
        
        const listaImagenes = producto.imagen_url ? producto.imagen_url.split(',').map(img => img.trim()) : [];
        const arrayTallas = producto.tallas && producto.tallas.trim() !== '' ? producto.tallas.split(',').map(t => t.trim()) : [];
        
        const limiteCaracteres = 50; 
        let descripcionCorta = producto.descripcion || '';
        let htmlSugerencia = descripcionCorta.length > limiteCaracteres ? `<span class="sugerencia-ver-mas">✨ Toca para ver detalles</span>` : '';

        // Estructura de la tarjeta
        card.innerHTML = `
            <div class="imagen-slider-container">
                <div class="imagen-wrapper">
                    ${listaImagenes.length > 0 && listaImagenes[0] !== '' ? listaImagenes.map(url => `<img class="producto-imagen" src="${url}" alt="${producto.nombre}" loading="lazy">`).join('') : `<img class="producto-imagen" src="https://picsum.photos/300/400" alt="${producto.nombre}">`}
                </div>
                ${listaImagenes.length > 1 ? `<div class="slider-indicador">↔ Deslizar (1/${listaImagenes.length})</div>` : ''}
            </div>
            <div class="producto-info">
                <h3 class="producto-nombre">${producto.nombre}</h3>
                <p class="producto-descripcion">${descripcionCorta.substring(0, limiteCaracteres) + (descripcionCorta.length > limiteCaracteres ? '...' : '')}</p>
                <div class="sugerencia-container">${htmlSugerencia}</div>
                ${arrayTallas.length > 0 ? `<div class="producto-tallas"><div class="tallas-lista">${arrayTallas.map(t => `<span class="talla-item" style="padding: 2px 6px; font-size: 10px; pointer-events: none;">${t}</span>`).join('')}</div></div>` : ''}
                <p class="producto-precio">${producto.precio} CUP</p>
                <button class="btn-whatsapp btn-directo-ws">Encargar por WhatsApp</button>
            </div>
        `;
        
        // Lógica de WhatsApp (Directo)
        card.querySelector('.btn-directo-ws').addEventListener('click', (e) => {
            e.stopPropagation();
            if (arrayTallas.length > 1) {
                abrirVistaDetallada(producto, listaImagenes);
                return;
            }
            enviarWhatsApp(producto, listaImagenes[0], arrayTallas.length === 1 ? arrayTallas[0] : '');
        });

        // Inyección en grid
        const gridMap = { 'ropa-masculina': 'grid-masculina', 'ropa-femenina': 'grid-femenina', 'accesorios-moda': 'grid-moda', 'accesorios-apple': 'grid-apple' };
        if (gridMap[producto.categoria]) document.getElementById(gridMap[producto.categoria]).appendChild(card);
    });
}

// Función centralizada de envío a WhatsApp (EL CAMBIO AQUÍ)
function enviarWhatsApp(producto, urlFoto, talla) {
    let urlFotoAbsoluta = urlFoto || '';
    if (urlFotoAbsoluta && !urlFotoAbsoluta.startsWith('http')) {
        let base = window.location.href.split('index.html')[0];
        urlFotoAbsoluta = (base.endsWith('/') ? base : base + '/') + urlFotoAbsoluta;
    }

    const mensaje = `Hola D'Morales, deseo encargar el siguiente producto:\n\n*${producto.nombre}*${talla ? `\n*Talla:* ${talla}` : ''}\n*Precio:* ${producto.precio} CUP\n\n¿Está disponible?` + (urlFotoAbsoluta ? `\n\n${urlFotoAbsoluta}` : '');
    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

function abrirVistaDetallada(producto, listaImagenes) {
    const modal = document.getElementById('modal-producto');
    const body = document.getElementById('modal-body');
    const arrayTallas = producto.tallas ? producto.tallas.split(',').map(t => t.trim()) : [];
    
    body.innerHTML = `
        <div class="imagen-slider-container modal-slider"><div class="imagen-wrapper">${listaImagenes.map(url => `<img class="producto-imagen modal-img" src="${url}">`).join('')}</div></div>
        <div style="margin-top: 10px;">
            <h2>${producto.nombre}</h2>
            <p>${producto.descripcion}</p>
            ${arrayTallas.length > 0 ? `<div class="producto-tallas"><strong>Tallas:</strong><div class="tallas-lista">${arrayTallas.map(t => `<span class="talla-item" data-talla="${t}">${t}</span>`).join('')}</div><div class="error-talla" id="msg-error-talla">⚠️ Selecciona una talla.</div></div>` : ''}
            <p style="font-size: 20px; font-weight: 700;">${producto.precio} CUP</p>
            <button id="btn-comprar-modal" class="btn-whatsapp">Encargar por WhatsApp</button>
        </div>
    `;

    // Lógica tallas y envío modal
    body.querySelectorAll('.talla-item').forEach(btn => btn.addEventListener('click', (e) => {
        body.querySelectorAll('.talla-item').forEach(b => b.classList.remove('seleccionada'));
        e.target.classList.add('seleccionada');
        body.querySelector('#msg-error-talla').style.display = 'none';
    }));

    body.querySelector('#btn-comprar-modal').addEventListener('click', () => {
        const seleccion = body.querySelector('.talla-item.seleccionada');
        if (arrayTallas.length > 1 && !seleccion) {
            body.querySelector('#msg-error-talla').style.display = 'block';
            return;
        }
        enviarWhatsApp(producto, listaImagenes[0], seleccion ? seleccion.dataset.talla : arrayTallas[0]);
    });

    modal.classList.add('activo');
}
