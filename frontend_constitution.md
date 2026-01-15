# Frontend Constitution - Django Template & JavaScript Architecture

## Overview
PoolTrackerWeb frontend uses Django templates with Bootstrap 5 for UI, and vanilla JavaScript for interactivity. The design is based on the NiceAdmin Bootstrap template from BootstrapMade, with custom modifications for pool occupancy visualization.

## Technology Stack

### Core Technologies
- **Django Templates**: Server-side HTML rendering with Jinja2-like syntax
- **Bootstrap 5**: Responsive CSS framework
- **Vanilla JavaScript**: No frontend framework (React/Vue/Angular)
- **Plotly.js**: Interactive charting library
- **Chart.js**: Additional charting capabilities

### UI/UX Libraries
- **Bootstrap Icons**: Icon set
- **Simple Datatables**: Table enhancement
- **Quill & TinyMCE**: Rich text editors (vendor)
- **ApexCharts**: Chart visualization (vendor)

## Project Structure

### Templates (`/tablechart/templates/`)
```
templates/
├── index.html           # Main layout/base template
├── content.html         # Dashboard content (extends index.html)
├── dashboard.html       # Dashboard cards and widgets
├── live_chart.html      # Real-time occupancy chart
├── stats_chart.html     # Historical statistics chart
├── chat_widget.html     # Chatbot widget UI
├── popup_*.html         # Info popups for each pool
├── faq.html            # FAQ page
└── 404.html            # Custom 404 page
```

### Static Files (`/tablechart/static/assets/`)
```
static/assets/
├── css/
│   ├── style.css           # Main custom styles
│   └── chatbot-widget.css  # Chatbot styling
├── js/
│   ├── main.js             # Main application logic
│   └── chatbot-widget.js   # Chatbot functionality
├── img/                    # Images and icons
└── vendor/                 # Third-party libraries
    ├── bootstrap/          # Bootstrap 5
    ├── bootstrap-icons/    # Icons
    ├── chart.js/          # Chart.js library
    ├── apexcharts/        # ApexCharts library
    ├── simple-datatables/ # Table library
    ├── quill/             # Quill editor
    └── tinymce/           # TinyMCE editor
```

## Template Architecture

### Base Template Pattern
**index.html** serves as the base template with:
- HTML structure
- Navigation header
- Sidebar
- Footer
- Script/style includes

**content.html** extends index.html:
```django
{% extends "index.html" %}
{% block content %}
  <!-- Page-specific content -->
{% endblock %}
```

### Template Syntax (Django)
```django
{# Comments #}
{{ variable }}              # Variable output
{% tag %}                   # Template tags
{% if condition %}...{% endif %}
{% for item in list %}...{% endfor %}
{% url 'url_name' %}       # URL generation
{% static 'path/to/file' %}  # Static file URL
{{ variable|filter }}       # Template filters
```

### Context Variables from Backend
**content.html** receives:
- `date`: List of timestamps (formatted strings)
- `sport`, `family`, `small`, `ice`: Occupancy numbers (lists)
- `lastsport`, `lastfamily`, `lastsmall`, `lastice`: Current occupancy
- `sport_percent`, `family_percent`, `small_percent`, `ice_percent`: Percentages
- `lastdate`: Last update timestamp
- `weather`: Weather data object (icon, description, temp, etc.)
- `stats_chart`: Pre-rendered HTML for stats chart
- `session_id`: Session identifier for security
- `ver_num`: Application version number
- `opening`: Days until pool opening (countdown feature)

## JavaScript Architecture

### Main Application Logic (`main.js`)

#### Structure
```javascript
(function() {
  "use strict";
  
  // 1. Helper functions
  // 2. Chart initialization
  // 3. Event listeners
  // 4. UI interactions
  
})();
```

#### Key Functions

**Chart Management**:
- Chart rendering with Plotly.js
- Real-time data updates
- Zoom/pan interactions
- Responsive resizing

**AJAX Data Fetching**:
- `fetch()` API for asynchronous requests
- Session-based authentication
- Date picker interactions
- Stats chart updates

**UI Interactions**:
- Sidebar toggle
- Back-to-top button
- Tooltip initialization
- Table enhancements

#### Data Flow Pattern
```javascript
// 1. User interaction (click date picker)
// 2. Fetch data from Django endpoint
fetch('/get_date_data/?date=' + selectedDate, {
  headers: {
    'X-Session-Key': sessionId
  }
})
// 3. Process JSON response
.then(response => response.json())
// 4. Update DOM/charts
.then(data => updateCharts(data))
```

### Chatbot Widget (`chatbot-widget.js`)

#### Architecture
```javascript
class ChatbotWidget {
  constructor() {
    this.init();
  }
  
  init() {
    // Setup UI elements
    // Bind event listeners
  }
  
  sendMessage(message) {
    // AJAX request to chatbot backend
  }
  
  displayMessage(message, sender) {
    // Update chat UI
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new ChatbotWidget();
});
```

#### Features
- Toggle widget visibility
- Message input validation (max 250 chars)
- Real-time message display
- Session management
- Error handling
- Loading states

#### AJAX Pattern for Chatbot
```javascript
fetch('/chatbot/chat/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': getCookie('csrftoken')
  },
  body: JSON.stringify({
    message: userMessage
  })
})
.then(response => response.json())
.then(data => {
  displayBotMessage(data.response);
});
```

## Chart Implementation

### Live Occupancy Chart (Plotly.js)
**Location**: Rendered in `content.html` template

**Data Format**:
```javascript
var trace1 = {
  x: {{ date|safe }},      // Timestamps
  y: {{ sport|safe }},     // Occupancy values
  name: 'Sport Pool',
  type: 'scatter',
  mode: 'lines+markers'
};
```

**Features**:
- Multiple traces (one per pool)
- Max capacity lines (horizontal)
- Interactive zooming/panning
- Responsive sizing
- Timezone-aware timestamps
- Polish language labels

**Configuration**:
```javascript
var layout = {
  title: 'Obłożenie basenów',
  xaxis: { title: 'Czas' },
  yaxis: { title: 'Liczba osób' },
  hovermode: 'closest'
};

Plotly.newPlot('chartDiv', traces, layout, {
  responsive: true
});
```

### Historical Stats Chart
**Location**: `stats_chart.html` (loaded via AJAX)

**Update Mechanism**:
```javascript
// Day selector buttons trigger update
document.querySelectorAll('.day-selector').forEach(btn => {
  btn.addEventListener('click', function() {
    const day = this.dataset.day;
    fetch(`/update_chart/stats${day}`)
      .then(res => res.json())
      .then(data => updateStatsChart(data));
  });
});
```

## UI Components

### Dashboard Cards
**Structure**:
```html
<div class="col-lg-3 col-md-6">
  <div class="card info-card">
    <div class="card-body">
      <h5 class="card-title">Pool Name</h5>
      <div class="d-flex align-items-center">
        <div class="card-icon">
          <!-- Icon -->
        </div>
        <div class="ps-3">
          <h6>{{ lastsport }}</h6>
          <span class="text-success small pt-1 fw-bold">
            {{ sport_percent }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Dynamic Styling**:
- Green (< 80%): Good capacity
- Red (> 80%): High capacity
- Applied via Django template logic

### Info Popups
**Pattern**: Bootstrap modals for each pool
```html
<button data-bs-toggle="modal" data-bs-target="#sportModal">
  Info
</button>

<div class="modal fade" id="sportModal">
  <div class="modal-dialog">
    <div class="modal-content">
      <!-- Pool information -->
    </div>
  </div>
</div>
```

### Date Picker
**Implementation**: HTML5 date input with JavaScript handler
```html
<input type="date" id="datePicker" class="form-control">
```

```javascript
document.getElementById('datePicker').addEventListener('change', function() {
  const selectedDate = this.value;
  fetchDateData(selectedDate);
});
```

### Weather Widget
**Display**: Shows current weather for Białystok
```html
<div class="weather-widget">
  <img src="https://openweathermap.org/img/wn/{{ weather.icon }}@2x.png">
  <span>{{ weather.temp }}°C</span>
  <span>{{ weather.description }}</span>
</div>
```

## Styling Conventions

### CSS Organization (`style.css`)
1. **Global Styles**: Typography, colors, layout
2. **Component Styles**: Cards, buttons, navigation
3. **Custom Components**: Charts, widgets, specific features
4. **Responsive Overrides**: Media queries
5. **Utility Classes**: Spacing, colors, text alignment

### Bootstrap Customization
- Uses default Bootstrap 5 classes
- Custom overrides in style.css
- Color scheme follows template (blues/greens)
- Responsive breakpoints: sm, md, lg, xl, xxl

### Color Scheme
```css
/* Primary colors from NiceAdmin template */
--primary: #4154f1;
--secondary: #012970;
--success: #198754;
--danger: #dc3545;
--warning: #ffc107;
--info: #0dcaf0;
```

## State Management

### Session Management
- Session ID stored in JavaScript variable from Django context
- Sent with AJAX requests for authentication
- No localStorage/sessionStorage for sensitive data

### Client-Side State
- Chart states managed by Plotly/Chart.js libraries
- Chatbot widget state (open/closed) in CSS classes
- Form states managed by Bootstrap
- No global state management library (Redux/Vuex)

### Data Caching
- No client-side caching beyond browser default
- Data fetched on-demand via AJAX
- Charts re-render on data updates

## Responsive Design

### Breakpoints (Bootstrap 5)
- **xs**: < 576px (mobile)
- **sm**: ≥ 576px (small tablet)
- **md**: ≥ 768px (tablet)
- **lg**: ≥ 992px (desktop)
- **xl**: ≥ 1200px (large desktop)
- **xxl**: ≥ 1400px (extra large)

### Mobile Considerations
- Sidebar collapses to hamburger menu
- Charts resize responsively
- Cards stack vertically on mobile
- Touch-friendly button sizes
- Simplified navigation

### Chart Responsiveness
```javascript
// Plotly responsive mode
Plotly.newPlot('div', data, layout, {
  responsive: true
});

// Window resize handler
window.addEventListener('resize', () => {
  Plotly.Plots.resize('chartDiv');
});
```

## Security Considerations

### CSRF Protection
```javascript
// Get CSRF token from cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      if (cookie.trim().startsWith(name + '=')) {
        cookieValue = decodeURIComponent(
          cookie.trim().substring(name.length + 1)
        );
      }
    }
  }
  return cookieValue;
}

// Include in POST requests
headers: {
  'X-CSRFToken': getCookie('csrftoken')
}
```

### Session Validation
- Session ID passed with AJAX requests
- Backend validates session before returning data
- 30-minute session timeout

### Input Sanitization
- Django templates auto-escape HTML
- JavaScript input validation before sending
- Backend validation of all inputs
- Max message length (250 chars) for chatbot

## Internationalization

### Language
- **Primary**: Polish (pl)
- **Fallback**: English for technical terms
- Hard-coded strings in templates and JavaScript
- No i18n framework implemented

### Date/Time Formatting
- European format: DD.MM.YYYY HH:MM
- 24-hour time format
- Timezone: Europe/Warsaw (handled by backend)

### Number Formatting
- Polish decimal separator conventions
- Percentage display: whole numbers (no decimals)
- Temperature: Celsius

## Performance Optimization

### Static File Handling
- WhiteNoise serves static files in production
- Vendor libraries served from local files (not CDN)
- No asset bundling/minification currently

### Chart Performance
- Plotly.js for interactive charts (performant for medium datasets)
- Data points limited by backend (6 AM - 9 PM daily)
- No infinite scroll or pagination needed

### AJAX Optimization
- Fetch API (modern, lightweight)
- JSON responses (minimal payload)
- No polling - manual refresh or user-triggered updates

### Lazy Loading
- Charts rendered on initial page load
- Chatbot loaded on demand (when opened)
- Vendor libraries loaded in footer

## Browser Compatibility

### Supported Browsers
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- No IE11 support

### JavaScript Features Used
- ES6+ syntax (const, let, arrow functions)
- Fetch API
- Promises
- Template literals
- Classes

### Polyfills
- None currently included
- Bootstrap 5 handles some compatibility

## Working with AI Agents

### When Modifying Frontend

#### Adding New Charts
1. Prepare data in Django view
2. Pass to template via context
3. Use Plotly.js for consistency
4. Follow responsive pattern
5. Test on mobile devices

#### Adding New Endpoints
1. Create Django view
2. Add URL pattern
3. Implement AJAX in JavaScript
4. Include session authentication
5. Handle loading/error states

#### Styling Changes
1. Check Bootstrap utilities first
2. Add custom CSS to style.css if needed
3. Maintain color scheme consistency
4. Test responsive breakpoints
5. Verify contrast/accessibility

#### Chatbot Modifications
1. Update backend prompt (langchain_utils.py)
2. Adjust UI in chat_widget.html
3. Modify interactions in chatbot-widget.js
4. Test with Polish language inputs
5. Validate message length limits

### Code Style Conventions
- **JavaScript**: 
  - Use `const` and `let`, avoid `var`
  - Semicolons required
  - 2-space indentation
  - camelCase for variables/functions
  - PascalCase for classes
- **HTML/Templates**:
  - 2-space indentation
  - Bootstrap classes preferred
  - Semantic HTML5 elements
  - ARIA attributes for accessibility
- **CSS**:
  - 2-space indentation
  - BEM naming optional
  - Group related rules
  - Comment major sections

### Testing Approach
- Manual browser testing (no automated frontend tests)
- Test in Chrome, Firefox, Safari
- Verify mobile responsive behavior
- Check AJAX success/error handling
- Validate form submissions
- Test chatbot conversation flows
- Verify chart interactions (zoom, pan, hover)

### Debugging Tips
- Use browser DevTools Console for errors
- Network tab for AJAX debugging
- Plotly.js errors often relate to data format
- Check session_id presence for auth issues
- Verify CSRF token for POST requests

## Future Enhancements

### Potential Improvements
- Add frontend build system (Webpack/Vite)
- Implement CSS/JS minification
- Add Progressive Web App (PWA) features
- Implement WebSocket for real-time updates
- Add dark mode toggle
- Implement frontend routing (SPA)
- Add unit tests (Jest/Vitest)
- Improve accessibility (WCAG 2.1 AA)
- Add i18n framework for multi-language support

### Library Updates
- Keep Bootstrap updated
- Update Plotly.js for new features
- Monitor security updates for vendor libraries
- Consider replacing jQuery dependencies (if any)
