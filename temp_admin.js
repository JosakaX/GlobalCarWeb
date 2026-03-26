document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('inventory-tbody');
    const totalCount = document.getElementById('total-count');

    // Utility: format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(value);
    };

    // Utility: format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    window.vehiclesData = []; // Store globally for edit modal access

    const loadInventory = async () => {
        try {
            const response = await fetch('/api/vehicles');
            if (!response.ok) throw new Error('Error fetching inventory');
            
            const vehicles = await response.json();
            window.vehiclesData = vehicles; // Save to global
            totalCount.innerText = `Total: ${vehicles.length}`;
            tbody.innerHTML = '';

            // Calculate statistics
            const stats = { available: 0, transit: 0, sold: 0, likes: 0 };
            vehicles.forEach(v => {
                if (v.status === 'available') stats.available++;
                if (v.status === 'transit') stats.transit++;
                if (v.status === 'sold') stats.sold++;
                if (v.likes) stats.likes += v.likes;
            });

            // Update DOM statistics
            document.getElementById('stat-available').innerText = stats.available;
            document.getElementById('stat-transit').innerText = stats.transit;
            document.getElementById('stat-sold').innerText = stats.sold;
            document.getElementById('stat-likes').innerText = stats.likes;

            if (vehicles.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="py-12 text-center text-gray-500 font-medium text-lg">
                            No hay veh├¡culos en el inventario. <a href="/admin" class="text-gc-blue hover:underline">Sube uno nuevo</a>.
                        </td>
                    </tr>
                `;
                return;
            }

            vehicles.forEach(v => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-gray-50 transition-colors group';
                
                // First image or placeholder
                const imgUrl = v.images && v.images.length > 0 ? v.images[0] : 'https://via.placeholder.com/150';
                
                // Status mapping
                let statusHtml = '';
                if (v.status === 'available') statusHtml = '<span class="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200 uppercase tracking-wide">Disponible</span>';
                else if (v.status === 'transit') statusHtml = '<span class="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 uppercase tracking-wide">En Tr├ínsito</span>';
                else statusHtml = '<span class="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full border border-gray-200 uppercase tracking-wide">Vendido</span>';

                tr.innerHTML = `
                    <td class="py-4 pr-4">
                        <img src="${imgUrl}" alt="${v.make} ${v.model}" class="w-24 h-16 object-cover rounded-lg border border-gray-200 shadow-sm">
                    </td>
                    <td class="py-4 px-4">
                        <div class="font-black text-lg text-gray-900 leading-tight">${v.make} <span class="text-gray-500 font-medium">${v.year}</span></div>
                        <div class="text-gray-500 font-medium mt-1 truncate max-w-[200px]">${v.model}</div>
                    </td>
                    <td class="py-4 px-4 font-bold text-lg text-gray-900">
                        ${formatCurrency(v.price)}
                    </td>
                    <td class="py-4 px-4 hidden md:table-cell">
                        ${statusHtml}
                    </td>
                    <td class="py-4 px-4 hidden lg:table-cell text-gray-500 font-medium">
                        ${formatDate(v.created_at)}
                    </td>
                    <td class="py-4 px-4 text-center font-bold text-gray-700">
                        ${v.likes || 0}
                    </td>
                    <td class="py-4 pl-4 text-right">
                        <div class="flex justify-end gap-2">
                            <button onclick="openEditModal('${v.id}')" class="text-gray-400 hover:text-gc-blue p-2 rounded-lg hover:bg-blue-50 transition-colors tooltip outline-none" title="Editar veh├¡culo">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                            <button onclick="deleteVehicle('${v.id}')" class="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors tooltip outline-none" title="Eliminar veh├¡culo">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

        } catch (error) {
            console.error('Error loading inventory:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-12 text-center text-red-500 font-bold text-lg">
                        Error al cargar el inventario. Intenta refrescar la p├ígina.
                    </td>
                </tr>
            `;
        }
    };

    // Attach to window so onclick can see it
    window.deleteVehicle = async (id) => {
        if (!confirm('ΓÜá∩╕Å ┬┐Est├ís seguro de que deseas ELIMINAR permanentemente este veh├¡culo? Esta acci├│n no se puede deshacer.')) {
            return;
        }

        try {
            const response = await fetch(`/api/vehicles/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'No se pudo eliminar el veh├¡culo');
            }

            // Reload inventory
            await loadInventory();
            
            // Minimal toast/alert
            alert('Veh├¡culo eliminado exitosamente del cat├ílogo.');

        } catch (error) {
            console.error('Delete error:', error);
            alert('Error eliminando: ' + error.message);
        }
    };

    window.openEditModal = (id) => {
        const vehicle = window.vehiclesData.find(v => v.id === id);
        if (!vehicle) return;

        document.getElementById('edit-id').value = vehicle.id; // Corrected from .val
        document.getElementById('edit-make').value = vehicle.make;
        document.getElementById('edit-model').value = vehicle.model;
        document.getElementById('edit-year').value = vehicle.year;
        document.getElementById('edit-price').value = vehicle.price;
        document.getElementById('edit-status').value = vehicle.status;
        document.getElementById('edit-description').value = vehicle.description || '';
        document.getElementById('edit-images').value = ''; // Reset files

        document.getElementById('edit-modal').classList.remove('hidden');
        document.getElementById('edit-modal').classList.add('flex');
    };

    window.closeEditModal = () => {
        document.getElementById('edit-modal').classList.add('hidden');
        document.getElementById('edit-modal').classList.remove('flex');
    };

    // Funci├│n para comprimir una imagen usando Canvas
    const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height *= maxWidth / width));
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width *= maxHeight / height));
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    }, 'image/jpeg', quality);
                };
                img.onerror = () => resolve(file);
            };
            reader.onerror = () => resolve(file);
        });
    };

    window.saveEditVehicle = async () => {
        const id = document.getElementById('edit-id').value;
        const make = document.getElementById('edit-make').value.trim();
        const model = document.getElementById('edit-model').value.trim();
        const year = document.getElementById('edit-year').value;
        const price = document.getElementById('edit-price').value;
        const status = document.getElementById('edit-status').value;
        const description = document.getElementById('edit-description').value.trim();
        const imagesInput = document.getElementById('edit-images');

        if (!make || !model || !year || !price) {
            alert('Por favor, completa los campos requeridos (Marca, Modelo, A├▒o, Precio).');
            return;
        }

        const files = imagesInput.files;
        if (files.length > 0 && files.length !== 4) {
            alert('Si vas a actualizar fotos, por favor sube exactamente 4 im├ígenes.');
            return;
        }

        const btnSave = document.getElementById('btn-save-edit');
        const originalText = btnSave.innerText;
        btnSave.innerText = 'Guardando...';
        btnSave.disabled = true;

        try {
            // Using FormData
            const formData = new FormData();
            formData.append('make', make);
            formData.append('model', model);
            formData.append('year', year);
            formData.append('price', price);
            formData.append('status', status);
            formData.append('description', description);

            // Comprimir im├ígenes si hay
            for (let i = 0; i < files.length; i++) {
                const compressed = await compressImage(files[i]);
                formData.append(`image_${i}`, compressed);
            }

            const response = await fetch(`/api/vehicles/${id}`, {
                method: 'PUT',
                body: formData
            });

            const textResponse = await response.text();
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                console.error("Respuesta cruda del servidor:", textResponse);
                throw new Error("El servidor devolvi├│ un error (Posiblemente el archivo es muy pesado o hubo una falla interna).");
            }

            if (!response.ok) {
                throw new Error(data.error || 'No se pudo actualizar el veh├¡culo');
            }

            closeEditModal();
            await loadInventory();
            alert('Veh├¡culo actualizado exitosamente.');
        } catch (error) {
            console.error('Update error:', error);
            alert('Error actualizando: ' + error.message);
        } finally {
            btnSave.innerText = originalText;
            btnSave.disabled = false;
        }
    };

    // --- Price Lists Functions ---
    const setPreview = (elementId, url) => {
        const el = document.getElementById(elementId);
        if (!el) return;
        const isPdf = url.toLowerCase().includes('.pdf');
        
        let newHtml = '';
        if (isPdf) {
            newHtml = `<iframe id="${elementId}" src="${url}#toolbar=0&navpanes=0&scrollbar=0" class="${el.className} pointer-events-none" scrolling="no"></iframe>`;
        } else {
            newHtml = `<img id="${elementId}" src="${url}" class="${el.className}">`;
        }
        el.outerHTML = newHtml;
    };

    const loadSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            if (!response.ok) return;
            const data = await response.json();
            if (data.price_list_1) setPreview('preview-price-list-1', data.price_list_1);
            if (data.price_list_2) setPreview('preview-price-list-2', data.price_list_2);
        } catch (error) {
            console.error("Could not load settings:", error);
        }
    };

    window.updatePriceList = async (cardId) => {
        const fileInput = document.getElementById(`upload-price-list-${cardId}`);
        if (!fileInput.files.length) {
            alert('Por favor, selecciona una imagen para cargar.');
            return;
        }

        const btn = document.getElementById(`btn-update-price-list-${cardId}`);
        const originalText = btn.innerText;
        btn.innerText = 'Subiendo...';
        btn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);

            const response = await fetch(`/api/settings/price_list/${cardId}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'No se pudo subir la imagen');
            }

            const result = await response.json();
            setPreview(`preview-price-list-${cardId}`, result.url);
            alert('Documento/Imagen actualizado exitosamente. Los cambios ya son visibles en la p├ígina principal.');
            fileInput.value = ''; // Reset
        } catch (error) {
            alert('Error actualizando la imagen: ' + error.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };

    // --- Marcas Management Functions ---
    window.brandsData = [];
    const loadBrands = async () => {
        try {
            const response = await fetch('/api/marcas');
            if (!response.ok) throw new Error('Error fetching marcas');
            const data = await response.json();
            window.brandsData = data;
            
            // Populate edit-make select
            const editMakeSelect = document.getElementById('edit-make');
            if (editMakeSelect) {
                editMakeSelect.innerHTML = '<option value="" disabled>Seleccionar Marca</option>';
                data.forEach(marca => {
                    const opt = document.createElement('option');
                    opt.value = marca.nombre;
                    opt.textContent = marca.nombre;
                    editMakeSelect.appendChild(opt);
                });
            }
        } catch (error) {
            console.error('Error loading brands:', error);
        }
    };

    const renderBrandsList = () => {
        const ul = document.getElementById('brands-list');
        if (!ul) return;
        
        ul.innerHTML = '';
        if (window.brandsData.length === 0) {
            ul.innerHTML = '<li class="p-4 text-center text-gray-500 font-medium">No hay marcas configuradas. A├▒ade una arriba.</li>';
            return;
        }

        window.brandsData.forEach(marca => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-gray-300';
            
            li.innerHTML = `
                <span class="font-black text-gray-800 uppercase tracking-wide text-lg ml-2">${marca.nombre}</span>
                <button onclick="deleteBrandFromDb('${marca.id}', '${marca.nombre}')" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors outline-none tooltip" title="Eliminar Marca">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            `;
            ul.appendChild(li);
        });
    };

    window.openBrandsModal = () => {
        renderBrandsList();
        document.getElementById('new-brand-name').value = '';
        document.getElementById('brands-modal').classList.remove('hidden');
        document.getElementById('brands-modal').classList.add('flex');
    };

    window.closeBrandsModal = () => {
        document.getElementById('brands-modal').classList.add('hidden');
        document.getElementById('brands-modal').classList.remove('flex');
    };

    window.addBrand = async () => {
        const input = document.getElementById('new-brand-name');
        const nombre = input.value.trim().toUpperCase();
        
        if (!nombre) {
            alert('Por favor, ingresa el nombre de la marca.');
            input.focus();
            return;
        }

        try {
            const response = await fetch('/api/marcas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'No se pudo crear la marca');
            }

            // Reload brands and re-render
            await loadBrands();
            renderBrandsList();
            input.value = '';
        } catch (error) {
            alert('Error a├▒adiendo marca: ' + error.message);
        }
    };

    window.deleteBrandFromDb = async (id, nombre) => {
        if (!confirm(`┬┐Est├ís seguro de que deseas eliminar la marca "${nombre}"? \nEsta acci├│n es irreversible y no asume cambios sobre los veh├¡culos creados bajo esta marca.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/marcas/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'No se pudo eliminar la marca');
            }

            // Reload brands and re-render
            await loadBrands();
            renderBrandsList();
        } catch (error) {
            alert('Error eliminando la marca: ' + error.message);
        }
    };


    // Initial load
    window.loadInventory = loadInventory; // Export for potential external calls
    loadBrands();
    loadInventory();
    loadSettings();
});
