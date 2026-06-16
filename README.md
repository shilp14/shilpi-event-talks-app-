# BigQuery Release Notes Explorer

A modern, responsive web application that fetches, parses, and formats the Google BigQuery Release Notes RSS/Atom feed. The application allows users to explore changes by category (Features, Changes, Issues, and Deprecations) and draft/preview tweets to share updates on X (Twitter).

## 🚀 Features

*   **Live Feed Synchronization**: Automatically fetches and parses Google's BigQuery Release Notes Atom XML feed.
*   **Structured Filtering**: Clean visual indicators and quick filter pills to query updates by category (e.g., Features, Changes, Issues, Deprecations).
*   **Draft-to-Tweet Studio**:
    *   Auto-populates a tweet template with the update details and hashtags.
    *   Provides a **live dark-theme Twitter preview card** showing exactly how the tweet will look when posted.
    *   Built-in character counter (limit 280) that turns orange/red and disables submission if the limit is exceeded.
    *   Uses **Twitter Web Intents** for secure sharing without needing credentials or backend API key registration.
*   **Premium Dark UI**: Built with glassmorphism panels, interactive hover animations, and a responsive structure optimized for both desktop and mobile viewports.

---

## 🛠️ Technology Stack

*   **Backend**: Python 3.10+, Flask, `feedparser`
*   **Frontend**: Vanilla HTML5, CSS3 (using custom HSL palettes), Javascript (ES6)
*   **Icons**: FontAwesome 6.4

---

## 📂 Project Structure

```
├── app.py                # Flask application controller & feed parser
├── templates/
│   └── index.html        # Main HTML layout & X preview container
├── static/
│   ├── css/
│   │   └── style.css     # Glassmorphic dark theme stylesheet
│   └── js/
│       └── app.js        # Feed loading, category filter, and tweet editor logic
├── news.txt              # Sample raw news headlines
├── summary.txt           # Sample news headlines summary
└── .gitignore            # Git exclusion patterns
```

---

## 💻 Getting Started

### Prerequisites

*   Python 3.10 or higher installed on your system.

### Installation & Run

1.  **Clone the repository**:
    ```bash
    git clone git@github.com:shilp14/shilpi-event-talks-app-.git
    cd shilpi-event-talks-app-
    ```

2.  **Install dependencies**:
    ```bash
    pip install flask requests feedparser
    ```

3.  **Start the web server**:
    ```bash
    python app.py
    ```

4.  **Access the application**:
    Open your browser and navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.
