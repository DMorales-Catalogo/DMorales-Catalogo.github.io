const SPREADSHEET_ID = '1TeoYLaV7noS0VdzAKAt19vpUaJ7eL5G30Nc8r_EtHts';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=tsv`;
const WHATSAPP_NUMERO = '5355030077'; // Pon tu número de WhatsApp real aquí

window.addEventListener('DOMContentLoaded', () => {
    inicializarModal();
    cargarProductos();
});

// Estructura base de la ventana emergente insertada limpiamente en la web
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

    // Cerrar modal al hacer click en la X o fuera del cuadro blanco
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
        
        // --- CONTROL Y CORTE DE DESCRIPCIÓN ---
        const limiteCaracteres = 50; // Límite ideal para dos líneas limpias en móviles
        let descripcionCorta = producto.descripcion || '';
        let htmlSugerencia = '';

        if (descripcionCorta.length > limiteCaracteres) {
            descripcionCorta = descripcionCorta.substring(0, limiteCaracteres) + '...';
            htmlSugerencia = `<span class="sugerencia-ver-mas">✨ Toca para ver detalles</span>`;
        }

        // 1. Carrusel de imágenes
        let htmlSliderFuera = `<div class="imagen-slider-container">`;
        htmlSliderFuera += `<div class="imagen-wrapper">`;
        if (listaImagenes.length > 0 && listaImagenes[0] !== '') {
            listaImagenes.forEach(urlFoto => {
                htmlSliderFuera += `<img class="producto-imagen" src="${urlFoto}" alt="${producto.nombre}" loading="lazy" onerror="this.src='https://picsum.photos/300/400';">`;
            });
        } else {
            htmlSliderFuera += `<img class="producto-imagen" src="https://picsum.photos/300/400" alt="${producto.nombre}">`;
        }
        htmlSliderFuera += `</div>`;
        if (listaImagenes.length > 1) {
            htmlSliderFuera += `<div class="slider-indicador">↔ Deslizar (1/${listaImagenes.length})</div>`;
        }
        htmlSliderFuera += `</div>`;

        // 2. Tallas visibles
        let htmlTallasFuera = '';
        if (arrayTallas.length > 0) {
            htmlTallasFuera = `<div class="producto-tallas" style="margin-top: 2px;"><div class="tallas-lista">`;
            arrayTallas.forEach(talla => {
                htmlTallasFuera += `<span class="talla-item" style="padding: 2px 6px; font-size: 10px; pointer-events: none; cursor: default;">${talla}</span>`;
            });
            htmlTallasFuera += `</div></div>`;
        }

        // 3. Estructura de la tarjeta armada con la descripción estandarizada y el contenedor de sugerencia
        card.innerHTML = `
            ${htmlSliderFuera}
            <div class="producto-info">
                <h3 class="producto-nombre">${producto.nombre}</h3>
                <p class="producto-descripcion">${descripcionCorta}</p>
                <div class="sugerencia-container">${htmlSugerencia}</div>
                ${htmlTallasFuera}
                <p class="producto-precio" style="margin-bottom: 8px;">${producto.precio} CUP</p>
                <button class="btn-whatsapp btn-directo-ws" style="margin-top: auto; padding: 8px; font-size: 12px;">Encargar por WhatsApp</button>
            </div>
        `;
        
        // --- LÓGICA DE INTERACCIÓN (CLICKS / SLIDE) ---
        let deslizandoFoto = false;
        const contenedorFotos = card.querySelector('.imagen-wrapper');
        
        contenedorFotos.addEventListener('scroll', () => {
            deslizandoFoto = true;
            clearTimeout(card.dataset.scrollTimeout);
            card.dataset.scrollTimeout = setTimeout(() => { deslizandoFoto = false; }, 150);
        });

        card.addEventListener('click', (e) => {
            if (deslizandoFoto) return;
            abrirVistaDetallada(producto, listaImagenes);
        });

        const botonWsTarjeta = card.querySelector('.btn-directo-ws');
        botonWsTarjeta.addEventListener('click', (e) => {
            e.stopPropagation();

            if (arrayTallas.length > 1) {
                abrirVistaDetallada(producto, listaImagenes);
                setTimeout(() => {
                    const errorMsg = document.getElementById('msg-error-talla');
                    if (errorMsg) errorMsg.style.display = 'block';
                }, 300);
                return;
            }

            const tallaFinal = arrayTallas.length === 1 ? arrayTallas[0] : '';
            let urlFotoAbsoluta = listaImagenes[0] || '';
            if (urlFotoAbsoluta && !urlFotoAbsoluta.startsWith('http')) {
                let baseClean = window.location.href.split('index.html')[0];
                if (!baseClean.endsWith('/')) baseClean += '/';
                urlFotoAbsoluta = baseClean + urlFotoAbsoluta;
            }

            const lineaTalla = tallaFinal ? `\n*Talla:* ${tallaFinal}` : '';
            const lineaFoto = urlFotoAbsoluta ? `\n*Foto del producto:* ${urlFotoAbsoluta}` : '';
            const mensajeFinal = `Hola D'Morales, deseo encargar el siguiente producto:\n\n*${producto.nombre}*${lineaTalla}\n*Precio:* ${producto.precio} CUP${lineaFoto}\n\n¿Está disponible?`;
            
            window.open sabotage (`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensajeFinal)}`, '_blank');
        });

        let contenedorGrid;
        if (producto.categoria === 'ropa-masculina') contenedorGrid = document.getElementById('grid-masculina');
        else if (producto.categoria === 'ropa-femenina') contenedorGrid = document.getElementById('grid-femenina');
        else if (producto.categoria === 'accesorios-moda') contenedorGrid = document.getElementById('grid-moda');
        else if (producto.categoria === 'accesorios-apple') contenedorGrid = document.getElementById('grid-apple');
        
        if (contenedorGrid) {
            contenedorGrid.appendChild(card);
        }
    });

    document.querySelectorAll('.productos-grid .imagen-wrapper').forEach(wrapper => {
        wrapper.addEventListener('scroll', () => {
            const anchoImagen = wrapper.clientWidth;
            if (anchoImagen === 0) return;
            const paginaActual = Math.round(wrapper.scrollLeft / anchoImagen) + 1;
            const indicador = wrapper.parentElement.querySelector('.slider-indicador');
            const totalImagenes = wrapper.children.length;
            if (indicador) {
                indicador.textContent = `↔ Deslizar (${paginaActual}/${totalImagenes})`;
            }
        });
    });
}



function abrirVistaDetallada(producto, listaImagenes) {
    const modal = document.getElementById('modal-producto');
    const body = document.getElementById('modal-body');
    
    // Convertir la cadena de tallas de Excel en una lista limpia
    const arrayTallas = producto.tallas && producto.tallas.trim() !== '' ? producto.tallas.split(',').map(t => t.trim()) : [];

    // 1. Renderizar el carrusel de imágenes adaptado al tamaño completo
    let htmlSlider = `<div class="imagen-slider-container modal-slider"><div class="imagen-wrapper">`;
    if (listaImagenes.length > 0 && listaImagenes[0] !== '') {
        listaImagenes.forEach(urlFoto => {
            htmlSlider += `<img class="producto-imagen modal-img" src="${urlFoto}" alt="${producto.nombre}" onerror="this.src='https://picsum.photos/300/400';">`;
        });
    } else {
        htmlSlider += `<img class="producto-imagen modal-img" src="https://picsum.photos/300/400" alt="${producto.nombre}">`;
    }
    htmlSlider += `</div>`;
    if (listaImagenes.length > 1) {
        htmlSlider += `<div class="slider-indicador">↔ Deslizar (1/${listaImagenes.length})</div>`;
    }
    htmlSlider += `</div>`;

    // 2. Renderizar el sistema de selección de tallas
    let htmlTallas = '';
    if (arrayTallas.length > 0) {
        htmlTallas = `
            <div class="producto-tallas">
                <strong>Tallas disponibles:</strong>
                <div class="tallas-lista">
        `;
        arrayTallas.forEach(talla => {
            // Si hay una sola talla, se marca automáticamente como seleccionada
            const claseSeleccionada = arrayTallas.length === 1 ? 'seleccionada' : '';
            htmlTallas += `<span class="talla-item" data-talla="${talla}">${talla}</span>`;
        });
        htmlTallas += `
                </div>
                <div class="error-talla" id="msg-error-talla">⚠️ Por favor, selecciona una talla antes de completar el pedido.</div>
            </div>
        `;
    }

    // Inyectar toda la información extendida del producto en el modal
    body.innerHTML = `
        ${htmlSlider}
        <div style="margin-top: 5px; display: flex; flex-direction: column; gap: 8px;">
            <h2 style="font-size: 20px; font-weight: 700;">${producto.nombre}</h2>
            <p style="font-size: 15px; color: var(--color-oscuro); line-height: 1.4;">${producto.descripcion}</p>
            ${htmlTallas}
            <p style="font-size: 22px; font-weight: 700; margin: 5px 0;">${producto.precio} CUP</p>
            <button id="btn-comprar-modal" class="btn-whatsapp">Encargar por WhatsApp</button>
        </div>
    `;

    // Activar el control de movimiento del carrusel dentro del modal
    const wrapper = body.querySelector('.imagen-wrapper');
    if (wrapper) {
        wrapper.addEventListener('scroll', () => {
            const anchoImagen = wrapper.clientWidth;
            const paginaActual = Math.round(wrapper.scrollLeft / anchoImagen) + 1;
            const indicador = wrapper.parentElement.querySelector('.slider-indicador');
            if (indicador) indicador.textContent = `↔ Deslizar (${paginaActual}/${listaImagenes.length})`;
        });
    }

    // Lógica de clicks interactivos en las tallas
    const botonesTalla = body.querySelectorAll('.talla-item');
    botonesTalla.forEach(btn => {
        btn.addEventListener('click', () => {
            if (arrayTallas.length === 1) return; // Si es única, no hace falta cambiar nada
            botonesTalla.forEach(b => b.classList.remove('seleccionada'));
            btn.classList.add('seleccionada');
            body.querySelector('#msg-error-talla').style.display = 'none'; // Oculta el error si elige una
        });
    });

    // Acción del botón definitivo de encargo por WhatsApp
    body.querySelector('#btn-comprar-modal').addEventListener('click', () => {
        let tallaFinal = '';

        if (arrayTallas.length > 0) {
            const botonSeleccionado = body.querySelector('.talla-item.seleccionada');
            
            // Si hay varias tallas y no ha elegido ninguna, disparamos la alerta visual
            if (!botonSeleccionado && arrayTallas.length > 1) {
                body.querySelector('#msg-error-talla').style.display = 'block';
                return;
            }
            
            // Si todo está bien, tomamos la seleccionada o la única existente
            tallaFinal = botonSeleccionado ? botonSeleccionado.getAttribute('data-talla') : arrayTallas[0];
        }

        // Convertir la ruta local en una URL absoluta para que WhatsApp genere la vista previa de la foto
        let urlFotoAbsoluta = listaImagenes[0] || '';
        if (urlFotoAbsoluta && !urlFotoAbsoluta.startsWith('http')) {
            let baseClean = window.location.href.split('index.html')[0];
            if (!baseClean.endsWith('/')) baseClean += '/';
            urlFotoAbsoluta = baseClean + urlFotoAbsoluta;
        }

        // Construcción limpia del mensaje para tu chat
        const lineaTalla = tallaFinal ? `\n*Talla:* ${tallaFinal}` : '';
        const lineaFoto = urlFotoAbsoluta ? `\n*Foto del producto:* ${urlFotoAbsoluta}` : '';
        
        const mensajeFinal = `Hola D'Morales, deseo encargar el siguiente producto:\n\n*${producto.nombre}*${lineaTalla}\n*Precio:* ${producto.precio} CUP${lineaFoto}\n\n¿Está disponible?`;
        
        window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensajeFinal)}`, '_blank');
    });

    modal.classList.add('activo');
}

