export default async function handler(req, res) {
  const { token } = req.query;

  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  return res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Stalliongate - Protected Content</title>
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container { 
            background: white; 
            padding: 50px; 
            border-radius: 20px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 600px;
          }
          h1 { 
            color: #667eea; 
            margin: 0 0 20px 0;
            font-size: 32px;
          }
          p { 
            color: #555; 
            line-height: 1.8;
            font-size: 16px;
          }
          .icon { 
            font-size: 80px; 
            margin-bottom: 20px; 
          }
          .token {
            background: #f0f0f0;
            padding: 10px 20px;
            border-radius: 8px;
            font-family: monospace;
            margin-top: 20px;
            color: #667eea;
            font-weight: bold;
          }
          .brand {
            margin-top: 30px;
            color: #999;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🐴⚡</div>
          <h1>Stalliongate Protected</h1>
          <p>This content is protected by <strong>Stalliongate</strong>.</p>
          <p>Your access token has been verified.</p>
          <div class="token">Token: ${token}</div>
          <div class="brand">Powered by Stalliongate SaaS</div>
        </div>
      </body>
    </html>
  `);
}
