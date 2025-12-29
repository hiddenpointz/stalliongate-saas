import os
from flask import Flask, request, redirect, render_template_string

app = Flask(__name__)

# This matches the key you set in Vercel Settings
VALID_TOKEN = os.getenv("PROXY_TOKEN")
TARGET_SITE = "https://configurationalmodeling.com"

@app.route('/api/proxy')
def proxy():
    # 1. Look for the token in the URL: .../api/proxy?token=XYZ
    user_token = request.args.get('token')

    # 2. Check if the token provided matches your secret
    if user_token and user_token == VALID_TOKEN:
        # Redirect if correct
        return redirect(TARGET_SITE, code=302)
    
    # 3. If wrong or missing, show the Access Denied page
    return render_template_string('''
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f4f4f9;">
            <div style="max-width: 500px; margin: auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h1 style="color: #e74c3c;">Stalliongate: Access Denied</h1>
                <p style="color: #555;">The activation token provided is invalid or has expired.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.9em; color: #888;">Please contact your administrator for a valid access link.</p>
                <a href="/" style="display: inline-block; margin-top: 20px; text-decoration: none; color: #3498db; font-weight: bold;">Return to Home</a>
            </div>
        </body>
    '''), 401

# Vercel needs this to run the Flask app
def handler(event, context):
    return app(event, context)
