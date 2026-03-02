document.addEventListener('DOMContentLoaded', () => {
    // Referencias del DOM
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewGrid = document.getElementById('preview-grid');
    const uploadForm = document.getElementById('upload-form');
    
    let selectedFiles = [];

    // Cargar Marcas
    const loadBrands = async () => {
        try {
            const response = await fetch('/api/marcas');
            if (response.ok) {
                const marcas = await response.json();
                const selectElement = document.getElementById('marca-select');
                if (selectElement) {
                    marcas.forEach(marca => {
                        const option = document.createElement('option');
                        option.value = marca.nombre;
                        option.textContent = marca.nombre;
                        selectElement.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching marcas:', error);
        }
    };
    loadBrands();

    // Lógica principal al seleccionar archivos
    const handleFiles = (files) => {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        
        if (imageFiles.length !== 4) {
            alert("⚠️ Selecciona exactamente 4 fotos del vehículo.");
            return;
        }

        selectedFiles = imageFiles;
        renderPreviews();
    };

    const renderPreviews = () => {
        previewGrid.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'aspect-square bg-gray-100 rounded-2xl border-2 border-transparent overflow-hidden relative shadow-sm hover:shadow-md transition-shadow group';
                imgContainer.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                    <div class="absolute top-2 left-2 bg-gc-blue text-white text-xs w-6 h-6 flex items-center justify-center rounded-md font-bold shadow-md z-10">${index + 1}</div>
                    <!-- Delete (placeholder functionality) -->
                    <button class="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                `;
                previewGrid.appendChild(imgContainer);
            }
            reader.readAsDataURL(file);
        });
    };

    // Eventos del Input File normal y arrastrar y soltar
    fileInput.addEventListener('change', (e) => {
        handleFiles(Array.from(e.target.files));
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-gc-blue', 'bg-blue-50/50');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-gc-blue', 'bg-blue-50/50');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-gc-blue', 'bg-blue-50/50');
        
        if (e.dataTransfer.files) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    });

    // Envío del Formulario
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (selectedFiles.length !== 4) {
            alert("Por favor, asegúrate de haber cargado exactamente 4 imágenes.");
            return;
        }

        // Simulación visual mientras integramos
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            SUBIENDO...
        `;
        submitBtn.disabled = true;

        // Construir FormData
        const formData = new FormData();
        
        // Agregar fotos
        selectedFiles.forEach((file, idx) => {
            formData.append(`image_${idx}`, file);
        });

        // Obtener selects/inputs
        const selectMarca = document.getElementById('marca-select');
        const inputs = uploadForm.querySelectorAll('input:not([type="file"]), textarea');
        
        formData.append('make', selectMarca.value);
        formData.append('model', inputs[0].value);
        formData.append('year', inputs[1].value);
        formData.append('price', inputs[2].value);
        formData.append('status', document.getElementById('status-select').value);
        formData.append('description', inputs[3].value);

        try {
            const response = await fetch('/api/vehicles', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // Success
                submitBtn.innerHTML = "✅ VEHÍCULO SUBIDO";
                submitBtn.classList.replace('bg-gc-blue', 'bg-green-600');
                
                setTimeout(() => {
                    uploadForm.reset();
                    selectedFiles = [];
                    previewGrid.innerHTML = `
                        <div class="aspect-square bg-white rounded-2xl border-2 border-gray-200 border-dashed flex items-center justify-center text-gray-400 text-2xl font-black shadow-sm">1</div>
                        <div class="aspect-square bg-white rounded-2xl border-2 border-gray-200 border-dashed flex items-center justify-center text-gray-400 text-2xl font-black shadow-sm">2</div>
                        <div class="aspect-square bg-white rounded-2xl border-2 border-gray-200 border-dashed flex items-center justify-center text-gray-400 text-2xl font-black shadow-sm">3</div>
                        <div class="aspect-square bg-white rounded-2xl border-2 border-gray-200 border-dashed flex items-center justify-center text-gray-400 text-2xl font-black shadow-sm">4</div>
                    `;
                    submitBtn.innerHTML = originalText;
                    submitBtn.classList.replace('bg-green-600', 'bg-gc-blue');
                    submitBtn.disabled = false;
                }, 2000);
            } else {
                throw new Error(data.error || "Hubo un error al crear en Supabase");
            }

        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
});
