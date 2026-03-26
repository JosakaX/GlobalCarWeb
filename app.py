import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, abort
from supabase import create_client, Client
from dotenv import load_dotenv
import logging
import traceback
from functools import wraps
import json

# ==============================================================================
# CONFIGURACIÓN INICIAL
# ==============================================================================
load_dotenv()

# Logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-key-12345")

# Supabase connection
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# Credenciales de Admin
ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "1234")

if not supabase_url or not supabase_key:
    logger.error("Error: SUPABASE_URL o SUPABASE_KEY no configurados en .env")
    
# Inicialización del cliente de Supabase
try:
    supabase: Client = create_client(supabase_url, supabase_key)
    logger.info("Cliente de Supabase inicializado correctamente")
except Exception as e:
    logger.error(f"Error fatal inicializando Supabase: {str(e)}")
    supabase = None

# ==============================================================================
# DECORADORES Y SEGURIDAD
# ==============================================================================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

@app.after_request
def add_security_headers(response):
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

# ==============================================================================
# RUTAS PÚBLICAS
# ==============================================================================

@app.route('/')
def home():
    try:
        # Obtener vehículos recientes
        vehicles_query = supabase.table("vehicles").select("*").order("created_at", desc=True).limit(8).execute()
        vehicles = vehicles_query.data if vehicles_query.data else []
        
        # Obtener marcas para el filtro
        marcas_query = supabase.table("marcas").select("*").order("name").execute()
        marcas = marcas_query.data if marcas_query.data else []
        
        # Obtener configuración del sitio
        site_settings = supabase.table("site_settings").select("*").limit(1).execute().data
        settings = site_settings[0] if site_settings else {}
        
        return render_template('index.html', vehicles=vehicles, marcas=marcas, settings=settings)
    except Exception as e:
        logger.error(f"Error en home: {str(e)}")
        return render_template('index.html', vehicles=[], marcas=[], settings={})

@app.route('/vehicle/<int:id>')
def vehicle_detail(id):
    try:
        query = supabase.table("vehicles").select("*").eq("id", id).single().execute()
        vehicle = query.data
        if not vehicle:
            abort(404)
        return render_template('vehicle.html', vehicle=vehicle)
    except Exception as e:
        logger.error(f"Error en detalle vehiculo {id}: {str(e)}")
        abort(404)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username == ADMIN_USER and password == ADMIN_PASSWORD:
            session['logged_in'] = True
            session.permanent = True
            logger.info(f"Login exitoso para: {username}")
            return redirect(url_for('admin'))
        else:
            logger.warning(f"Intento de login fallido para: {username}")
            return render_template('login.html', error="Credenciales inválidas")
            
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

# ==============================================================================
# RUTAS DE ADMINISTRACIÓN
# ==============================================================================

@app.route('/admin')
@login_required
def admin():
    try:
        vehicles_query = supabase.table("vehicles").select("*").order("created_at", desc=True).execute()
        vehicles = vehicles_query.data if vehicles_query.data else []
        
        marcas_query = supabase.table("marcas").select("*").order("name").execute()
        marcas = marcas_query.data if marcas_query.data else []
        
        return render_template('admin.html', vehicles=vehicles, marcas=marcas)
    except Exception as e:
        logger.error(f"Error en dashboard admin: {str(e)}")
        return render_template('admin.html', vehicles=[], marcas=[], error="Error cargando datos de Supabase")

# ==============================================================================
# API RUTAS (CRUD VEHÍCULOS)
# ==============================================================================

@app.route('/api/vehicle', methods=['POST'])
@login_required
def add_vehicle():
    try:
        data = request.form.to_dict()
        # Procesar imágenes si hubiera carga de archivos
        # Por ahora asumimos que vienen URLs en el form
        
        response = supabase.table("vehicles").insert(data).execute()
        return jsonify({"status": "success", "data": response.data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/vehicle/<int:id>', methods=['PUT', 'DELETE'])
@login_required
def update_delete_vehicle(id):
    try:
        if request.method == 'DELETE':
            supabase.table("vehicles").delete().eq("id", id).execute()
            return jsonify({"status": "success"})
        
        data = request.json
        response = supabase.table("vehicles").update(data).eq("id", id).execute()
        return jsonify({"status": "success", "data": response.data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ==============================================================================
# ERROR HANDLERS
# ==============================================================================

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    logger.error(f"Error 500 detectado: {str(e)}")
    return render_template('500.html'), 500

# ==============================================================================
# EJECUCIÓN
# ==============================================================================

if __name__ == '__main__':
    # Flask local dev server
    app.run(host='0.0.0.0', port=5000, debug=True)
