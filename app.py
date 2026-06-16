from flask import Flask, jsonify, render_template, request
import feedparser
import re
import urllib.parse

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        # Parse the Atom XML feed
        feed = feedparser.parse(FEED_URL)
        
        if feed.bozo:
            # If there's a parsing error, check if we still got entries
            if not feed.entries:
                raise Exception("Failed to parse RSS feed: " + str(feed.bozo_exception))
                
        parsed_entries = []
        
        for entry in feed.entries:
            date = entry.title
            link = entry.link
            
            # The HTML content is usually in entry.content[0].value
            content_html = ""
            if hasattr(entry, 'content') and len(entry.content) > 0:
                content_html = entry.content[0].value
            elif hasattr(entry, 'summary'):
                content_html = entry.summary
                
            # Split feed content by <h3> headers
            pattern = re.compile(r'<h3[^>]*>(.*?)</h3>(.*?)(?=<h3|$)', re.DOTALL | re.IGNORECASE)
            matches = pattern.findall(content_html)
            
            updates = []
            if matches:
                for idx, (type_text, text_html) in enumerate(matches):
                    type_clean = type_text.strip()
                    
                    # Clean HTML tags to get pure text for tweeting
                    text_clean = re.sub(r'<[^>]+>', '', text_html).strip()
                    text_clean = " ".join(text_clean.split())
                    
                    # Format a default tweet suggestion
                    tweet_preview = f"BigQuery Update ({date}) - {type_clean}: {text_clean}"
                    if len(tweet_preview) > 250:
                        tweet_preview = tweet_preview[:247] + "..."
                    tweet_preview += " #BigQuery #GoogleCloud"
                    
                    updates.append({
                        'id': f"{entry.id}_{idx}",
                        'type': type_clean,
                        'html': text_html.strip(),
                        'text': text_clean,
                        'tweet_text': tweet_preview
                    })
            else:
                # Fallback if no <h3> tags are found in the entry
                text_clean = re.sub(r'<[^>]+>', '', content_html).strip()
                text_clean = " ".join(text_clean.split())
                
                tweet_preview = f"BigQuery Update ({date}): {text_clean}"
                if len(tweet_preview) > 250:
                    tweet_preview = tweet_preview[:247] + "..."
                tweet_preview += " #BigQuery #GoogleCloud"
                
                updates.append({
                    'id': f"{entry.id}_0",
                    'type': 'Update',
                    'html': content_html.strip(),
                    'text': text_clean,
                    'tweet_text': tweet_preview
                })
                
            parsed_entries.append({
                'date': date,
                'link': link,
                'updates': updates
            })
            
        return {
            "success": True,
            "title": feed.feed.title if hasattr(feed.feed, 'title') else "BigQuery Release Notes",
            "updated": feed.feed.updated if hasattr(feed.feed, 'updated') else "",
            "entries": parsed_entries
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    data = fetch_and_parse_feed()
    if data["success"]:
        return jsonify(data)
    else:
        return jsonify(data), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
