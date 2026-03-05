import os
import uuid
from functools import wraps
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from supabase import create_client, Client
from dotenv import load_dotenv

# Variables de entorno
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
ADMIN_USER = os.getenv("ADMIN_USER", "ADMIN")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "ADMIN22554769")

# Solo inicializa Supabase si hay credenciales
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

app = Flask(__name__)
# Secret key for session encryption
app.secret_key = os.getenv("FLASK_SECRET_KEY", os.urandom(24))
# Max tamaño de upload (para evitar bloqueos)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB

# --- AUTH DECORATORS ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def api_login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            return jsonify({"error": "No autorizado. Inicie sesión nuevamente."}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # Optional: response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains' # Descomentar para producción con HTTPS
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/catalogo')
def catalogo():
    return render_template('catalogo.html')

@app.route('/privacidad')
def privacidad():
    return render_template('privacidad.html')

@app.route('/terminos')
def terminos():
    return render_template('terminos.html')

@app.route('/admin')
@login_required
def admin():
    return render_template('admin.html')

@app.route('/admin/login', methods=['GET', 'POST'])
def login():
    if session.get('logged_in'):
        return redirect(url_for('admin_inventory'))
        
    error = None
    if request.method == 'POST':
        user = request.form.get('username')
        pwd = request.form.get('password')
        
        if user == ADMIN_USER and pwd == ADMIN_PASSWORD:
            session['logged_in'] = True
            return redirect(url_for('admin_inventory'))
        else:
            error = "Credenciales incorrectas. Verifique e intente nuevamente."
            
    return render_template('login.html', error=error)

@app.route('/admin/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

@app.route('/admin/inventory')
@login_required
def admin_inventory():
    return render_template('admin_inventory.html')

@app.route('/api/vehicles/<vehicle_id>', methods=['DELETE'])
@api_login_required
def delete_vehicle(vehicle_id):
    """Elimina un vehículo del catálogo"""
    if not supabase:
        return jsonify({"error": "Supabase credentials not configured."}), 500
    try:
        response = supabase.table('vehicles').delete().eq('id', vehicle_id).execute()
        return jsonify({"message": "Vehicle deleted successfully", "data": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/<vehicle_id>', methods=['PUT'])
@api_login_required
def update_vehicle(vehicle_id):
    """Actualiza la información de un vehículo"""
    if not supabase:
        return jsonify({"error": "Supabase credentials not configured."}), 500
    try:
        if request.is_json:
            data = request.json
        else:
            data = {
                "make": request.form.get('make'),
                "model": request.form.get('model'),
                "year": int(request.form.get('year', 2026)),
                "price": float(request.form.get('price', 0)),
                "status": request.form.get('status'),
                "description": request.form.get('description')
            }
            
            # Revisar si hay imagenes para actualizar
            images = []
            for key, file in request.files.items():
                if file and file.filename != '':
                    images.append(file)
            
            if images:
                if len(images) != 4:
                    return jsonify({"error": "Si vas a actualizar fotos, exactamente 4 imágenes son obligatorias"}), 400
                
                import datetime
                make = data.get('make', 'Desconocido').replace(' ', '_')
                date_str = datetime.datetime.now().strftime('%Y-%m-%d')
                
                image_urls = []
                for img in images:
                    file_extension = img.filename.split('.')[-1]
                    unique_filename = f"{make}/{date_str}/{uuid.uuid4()}.{file_extension}"
                    file_data = img.read()
                    res = supabase.storage.from_('vehicle-images').upload(unique_filename, file_data, {"content-type": img.content_type})
                    public_url = supabase.storage.from_('vehicle-images').get_public_url(unique_filename)
                    image_urls.append(public_url)
                
                data['images'] = image_urls
                
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # update fields in supabase
        response = supabase.table('vehicles').update(data).eq('id', vehicle_id).execute()
        return jsonify({"message": "Vehicle updated successfully", "data": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    """Trae todos los vehículos del catálogo"""
    if not supabase:
        return jsonify({"error": "Supabase credentials not configured."}), 500
        
    try:
        # Check for query parameters for filtering
        make = request.args.get('make')
        search_term = request.args.get('search')
        limit = request.args.get('limit', type=int)
        
        query = supabase.table('vehicles').select('*')
        
        if make:
            query = query.ilike('make', f'%{make}%')
        
        if search_term:
            # Construct the or_ filter dynamically
            or_filters = [
                f"make.ilike.%{search_term}%", 
                f"model.ilike.%{search_term}%",
                f"description.ilike.%{search_term}%",
                f"status.ilike.%{search_term}%"
            ]
            
            # If the search term is a number, also search in year and price
            # Limpiamos el texto quitando $, comas y puntos. Así "50.000" o "50,000" se vuelve "50000"
            cleaned_search = search_term.replace('$', '').replace(',', '').replace('.', '').strip()
            if cleaned_search.isdigit():
                or_filters.append(f"year.eq.{cleaned_search}")
                or_filters.append(f"price.eq.{cleaned_search}")
                
            query = query.or_(",".join(or_filters))
            
        featured = request.args.get('featured')
        
        if featured == 'true':
            # order by likes if featured
            query = query.order('likes', desc=True)
        else:
            query = query.order('created_at', desc=True)
        
        if limit is not None:
            query = query.limit(limit)
            
        response = query.execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles', methods=['POST'])
@api_login_required
def upload_vehicle():
    """Sube un nuevo vehículo con imágenes (o actualiza a futuro). Upload images a Supabase Storage y guarda details"""
    if not supabase:
        return jsonify({"error": "Supabase credentials not configured."}), 500

    try:
        # Extraer Form Data
        make = request.form.get('make')
        model = request.form.get('model')
        year = int(request.form.get('year', 2026))
        price = float(request.form.get('price', 0))
        status = request.form.get('status')
        description = request.form.get('description')

        # Manejador de imágenes (Son 4 las obligatorias según la UI)
        images = []
        for key, file in request.files.items():
            if file and file.filename != '':
                images.append(file)
                
        if len(images) != 4:
            return jsonify({"error": "Exactamente 4 imágenes son obligatorias"}), 400

        import datetime
        make_folder = str(make).replace(' ', '_') if make else 'Desconocido'
        date_str = datetime.datetime.now().strftime('%Y-%m-%d')
        
        image_urls = []
        # Upload al bucket 'vehicle-images'
        for img in images:
            file_extension = img.filename.split('.')[-1]
            unique_filename = f"{make_folder}/{date_str}/{uuid.uuid4()}.{file_extension}"
            
            # Subir a storage 
            # asumiendo que leer el archivo y mandarlo
            file_data = img.read()
            res = supabase.storage.from_('vehicle-images').upload(unique_filename, file_data, {"content-type": img.content_type})
            
            # Obtener URL Pública
            public_url = supabase.storage.from_('vehicle-images').get_public_url(unique_filename)
            image_urls.append(public_url)

        # Insertar a la base de datos
        vehicle_data = {
            "make": make,
            "model": model,
            "year": year,
            "price": price,
            "status": status,
            "description": description,
            "images": image_urls # Arreglo de strings
        }

        db_res = supabase.table('vehicles').insert(vehicle_data).execute()

        # Opcional: Aquí podemos llamar al Webhook de n8n
        # requests.post(N8N_WEBHOOK_URL, json=vehicle_data)

        return jsonify({"message": "Vehicle created successfully", "data": db_res.data[0]}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/<vehicle_id>/like', methods=['POST'])
def like_vehicle(vehicle_id):
    """Incrementa los likes de un vehículo y devuelve el nuevo contador"""
    if not supabase:
        return jsonify({"error": "Supabase credentials not configured."}), 500
        
    try:
        # Get current likes
        response = supabase.table('vehicles').select('likes').eq('id', vehicle_id).execute()
        if not response.data:
            return jsonify({"error": "Vehicle not found"}), 404
            
        current_likes = response.data[0].get('likes') or 0
        new_likes = current_likes + 1
        
        # Update likes
        update_res = supabase.table('vehicles').update({"likes": new_likes}).eq('id', vehicle_id).execute()
        
        return jsonify({"message": "Liked successfully", "likes": new_likes}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/settings', methods=['GET'])
def get_settings():
    if not supabase:
        return jsonify({}), 500
    try:
        res = supabase.table('site_settings').select('*').execute()
        settings = {row['key']: row['value'] for row in res.data}
        return jsonify(settings)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/settings/price_list/<int:card_id>', methods=['POST'])
@api_login_required
def update_price_list(card_id):
    if not supabase:
        return jsonify({"error": "Supabase credentials not configured."}), 500
    try:
        file = request.files.get('image')
        if not file or file.filename == '':
            return jsonify({"error": "No image provided"}), 400
            
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"price-lists/card_{card_id}_{uuid.uuid4()}.{file_extension}"
        file_data = file.read()
        
        supabase.storage.from_('vehicle-images').upload(unique_filename, file_data, {"content-type": file.content_type})
        public_url = supabase.storage.from_('vehicle-images').get_public_url(unique_filename)
        
        key = f'price_list_{card_id}'
        supabase.table('site_settings').update({'value': public_url}).eq('key', key).execute()
        
        return jsonify({"message": "Updated successfully", "url": public_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/marcas', methods=['GET'])
def get_marcas():
    if not supabase:
        return jsonify({"error": "Supabase credentials not configured."}), 500
    try:
        response = supabase.table('marcas').select('*').order('nombre').execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/marcas', methods=['POST'])
@api_login_required
def create_marca():
    if not supabase:
        return jsonify({"error": "Supabase credentials not configured."}), 500
    try:
        data = request.json
        if not data or not data.get('nombre'):
            return jsonify({"error": "El nombre de la marca es obligatorio"}), 400
        
        response = supabase.table('marcas').insert({"nombre": data['nombre'].upper()}).execute()
        return jsonify({"message": "Marca agregada exitosamente", "data": response.data[0]}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/marcas/<marca_id>', methods=['DELETE'])
@api_login_required
def delete_marca(marca_id):
    if not supabase:
        return jsonify({"error": "Supabase credentials not configured."}), 500
    try:
        response = supabase.table('marcas').delete().eq('id', marca_id).execute()
        return jsonify({"message": "Marca eliminada exitosamente", "data": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Producción (Modo seguro, el debug revela vulnerabilidades al exterior)
    app.run(debug=False, port=5000, host='0.0.0.0')
