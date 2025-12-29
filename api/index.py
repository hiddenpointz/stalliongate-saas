import os
from flask import Flask, request, redirect

app = Flask(__name__)

# This line looks for the secret you just saved in the dashboard
# If you didn't save it, this will return None
VALID_TOKEN = os.getenv("PROXY_TOKEN")

@app.route('/api/proxy')
def proxy_handler():
    # Grab the token the user typed in the URL (?token=...)
    user_token = request.args.get('token')

    # Compare the user's token to your secret VALID_TOKEN
    if user_token == VALID_TOKEN:
        return redirect("https://configurationalmodeling.com")
    
    return "Unauthorized", 401
