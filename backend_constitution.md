# Backend Constitution - Django Architecture

## Project Overview
PoolTrackerWeb is a Django-based web application for tracking swimming pool occupancy. It reads data from a MySQL database (populated by the [PoolTracker scraper](https://github.com/avrland/PoolTracker)) and displays live occupancy charts and statistics.

## Project Structure
```
tablechart/
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
├── tablechart/              # Core Django project (settings & config)
│   ├── settings.py          # Main configuration file
│   ├── urls.py              # Root URL configuration
│   ├── wsgi.py              # WSGI entry point
│   └── asgi.py              # ASGI entry point
├── chart_app/               # Main Django app for charts/occupancy
│   ├── models.py            # Database models
│   ├── views.py             # View functions for chart display
│   ├── urls.py              # URL routing for chart_app
│   └── admin.py             # Admin interface configuration
├── chatbot_app/             # AI chatbot integration app
│   ├── models.py            # Chat message models
│   ├── views.py             # Chatbot API endpoints
│   ├── urls.py              # URL routing for chatbot
│   └── langchain_utils.py   # LangChain/Gemini AI integration
├── templates/               # HTML templates
└── static/                  # Static files (CSS, JS, images)
```

## Core Technologies

### Framework & Dependencies
- **Django 5.2.6**: Main web framework
- **PyMySQL**: MySQL database connector
- **python-dotenv**: Environment variable management
- **Plotly**: Interactive chart generation
- **Pandas**: Data manipulation and analysis
- **WhiteNoise**: Static file serving
- **Requests**: HTTP library for external APIs
- **Gunicorn**: Production WSGI server

### AI/Chatbot Stack
- **LangChain**: Framework for LLM applications
- **langchain-google-genai**: Google Gemini integration
- **Pydantic**: Data validation for structured outputs
- **Qdrant Client**: Vector database client (for future enhancements)

## Database Architecture

### Connection
- **Engine**: MySQL via django.db.backends.mysql
- **Configuration**: Environment variables (DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT)
- **Direct SQL Queries**: Uses `connection.cursor()` for complex queries instead of ORM

### Tables
The app reads from two main tables (created by PoolTracker scraper):
- **poolStats**: Real-time occupancy data (current day from 6 AM)
  - Fields: `date`, `sport`, `family`, `small`, `ice`
- **poolStats_history**: Historical averages by weekday
  - Fields: `weekday`, `time`, `sport`, `family`, `small`, `ice`

### Pool Types
- **sport**: Sports pool (capacity: 105)
- **family**: Family pool (capacity: 150)
- **small**: Small/intimate pool (capacity: 30)
- **ice**: Ice rink (capacity: 300)

## Django Apps

### 1. chart_app (Main Application)
**Purpose**: Display pool occupancy charts and statistics

**Key Views** (`views.py`):
- `content_view()`: Main dashboard - shows live occupancy and stats
  - Fetches current day data from `poolStats`
  - Caches historical data from `poolStats_history`
  - Renders dashboard with charts and percentages
- `stats_view()`: Historical statistics by weekday
  - Filters cached data by selected weekday
  - Returns formatted stats chart HTML
- `update_chart()`: AJAX endpoint for updating stats by day
  - Returns JSON with occupancy data for specific weekday
- `get_date_data()`: Fetch historical data for specific date
  - Session-based authentication
  - Date range: 6 AM to 9 PM
  - Returns JSON with occupancy timeline

**URL Patterns**:
- `/` - Main dashboard
- `/update_chart/stats<day>` - Update stats chart
- `/get_date_data/` - Get date-specific data

**Additional Features**:
- Weather integration (OpenWeatherMap API)
- Session management for security
- Timezone handling (Europe/Warsaw)
- Cache usage for performance

### 2. chatbot_app (AI Assistant)
**Purpose**: AI-powered chatbot for answering pool occupancy questions

**Key Components**:
- `views.py`:
  - `chatbot_home()`: Renders chatbot interface
  - `chat_view()`: Handles chat messages via POST
  - `save_chat_history()`: Logs conversations to CSV
- `langchain_utils.py`:
  - `create_conversational_chain()`: Sets up LangChain with Gemini
  - `DjangoChatMessageHistory`: Django-backed chat history
  - `BotResponse`: Pydantic model for structured AI responses

**AI Configuration**:
- **Model**: Gemini 2.5 Flash
- **Temperature**: 0.3 (balanced creativity)
- **Prompt**: Polish language, pool-focused, friendly assistant
- **Context**: Uses cached pool statistics as knowledge base
- **Memory**: Stores conversation history in Django database

**URL Patterns**:
- `/chatbot/` - Chatbot home page
- `/chatbot/chat/` - AJAX chat endpoint

## Environment Variables (.env)
```env
DB_NAME=           # MySQL database name
DB_USER=           # MySQL username
DB_PASSWORD=       # MySQL password
DB_HOST=           # MySQL host
DB_PORT=           # MySQL port
SECRET_KEY=        # Django secret key
OPENWEATHER_API_KEY=  # Weather API key
GEMINI_API_KEY=    # Google Gemini API key
```

## Settings Configuration (settings.py)

### Security
- **DEBUG**: Set to True (change to False in production)
- **ALLOWED_HOSTS**: Currently allows all (`['*']`)
- **CSRF Protection**: Enabled via middleware
- **Session Management**:
  - SESSION_COOKIE_AGE: 1800 seconds (30 minutes)
  - SESSION_EXPIRE_AT_BROWSER_CLOSE: True

### Middleware Stack
1. SecurityMiddleware
2. SessionMiddleware
3. CommonMiddleware
4. CsrfViewMiddleware
5. AuthenticationMiddleware
6. MessageMiddleware
7. XFrameOptionsMiddleware
8. WhiteNoiseMiddleware (static files)

### Static Files
- **Development**: Multiple STATICFILES_DIRS
- **Production**: Single STATIC_ROOT
- **WhiteNoise**: Handles static file serving

### Internationalization
- **Language**: English (en-us)
- **Timezone**: UTC (converted to Europe/Warsaw in views)
- **I18N**: Enabled
- **TZ Support**: Enabled

## Key Patterns & Conventions

### Data Flow
1. **Scraper** (separate project) → MySQL database
2. **Django views** → Query database via cursor
3. **Pandas DataFrames** → Process data
4. **Plotly/Templates** → Render charts
5. **Browser** ← Serve HTML/JSON

### Caching Strategy
- Full historical data cached as `'fulldata'` in Django cache
- Reduces database queries for stats calculations
- Cached on first page load (`content_view`)

### Session Security
- Session keys required for authenticated endpoints
- `get_date_data()` validates session via headers
- CSRF protection for all POST requests

### Timezone Handling
- All database timestamps in UTC
- Converted to 'Europe/Warsaw' for display
- `pytz` used for timezone operations

### Error Handling
- Custom 404 handler: `handler404()` → renders 404.html
- Try-except blocks for external API calls (weather)
- Graceful degradation when data unavailable

## Development Workflow

### Local Setup
1. Install Python dependencies: `pip install -r requirements.txt`
2. Configure .env file with database and API credentials
3. Run development server: `python manage.py runserver 0.0.0.0:80`

### Database Migrations
- Currently no custom models (reads from external database)
- If adding models, use: `python manage.py makemigrations` → `python manage.py migrate`

### Testing
- Test file structure exists (`tests.py` in each app)
- No comprehensive test suite currently implemented

## Production Deployment

### Docker
- Dockerfile and docker-compose.yml provided
- Build: `docker compose build --no-cache`
- Run: `docker compose up -d`

### WSGI Server
- **Gunicorn**: Recommended for production
- WSGI entry point: `tablechart.wsgi:application`

### Static Files
- Collect static files: `python manage.py collectstatic`
- WhiteNoise serves static files in production

## API Integration

### OpenWeatherMap
- **Endpoint**: Current weather data
- **City**: Białystok, Poland
- **Function**: `get_weather_data()` in chart_app/views.py
- **Usage**: Displays weather on dashboard

### Google Gemini (via LangChain)
- **Model**: gemini-2.5-flash
- **Purpose**: Power the PoolBot chatbot
- **Context**: Pool occupancy statistics
- **Response Format**: Structured output via Pydantic

## Future Considerations

### Planned Features (from TODO)
- ML model for predicting occupancy
- More weather correlations with occupancy
- Enhanced statistics

### Potential Improvements
- Add Django ORM models for poolStats tables
- Implement comprehensive test suite
- Add API rate limiting for chatbot
- Implement proper logging framework
- Add database connection pooling
- Implement background tasks (Celery) for data updates

## Working with AI Agents

### When Modifying Backend
1. **Database changes**: Update queries in views.py, maintain timezone conversions
2. **New endpoints**: Add to app's urls.py, follow session authentication pattern
3. **New features**: Consider caching strategy for performance
4. **Chatbot changes**: Modify prompt in langchain_utils.py, test with Polish language
5. **Environment variables**: Add to .env and settings.py, update documentation

### Code Style
- Follow PEP 8 conventions
- Use descriptive variable names (existing code uses abbreviated names)
- Maintain timezone awareness for all datetime operations
- Keep views focused on request/response handling
- Use Django's built-in tools (cache, sessions) over custom implementations

### Testing Approach
- Test with actual database connection (or mock with test data)
- Verify timezone conversions
- Test session authentication flows
- Validate AJAX endpoints with proper headers
- Test chatbot with various Polish language inputs
