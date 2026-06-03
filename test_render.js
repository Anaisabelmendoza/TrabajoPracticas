const https = require('https');

const registerData = JSON.stringify({
  email: 'test_agent' + Date.now() + '@gmail.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'Agent',
  roles: ['ROLE_AGENT']
});

const req = https.request('https://trabajopracticas.onrender.com/api/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Register:', res.statusCode, body);
    
    // Login
    const loginData = JSON.stringify({
      email: JSON.parse(registerData).email,
      password: 'password123'
    });
    
    const loginReq = https.request('https://trabajopracticas.onrender.com/api/login_check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (loginRes) => {
      let loginBody = '';
      loginRes.on('data', d => loginBody += d);
      loginRes.on('end', () => {
        console.log('Login:', loginRes.statusCode, loginBody);
        
        const token = JSON.parse(loginBody).token;
        if (!token) return;
        
        // Get Tickets
        const ticketsReq = https.request('https://trabajopracticas.onrender.com/api/tickets', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/ld+json'
          }
        }, (tRes) => {
          let tBody = '';
          tRes.on('data', d => tBody += d);
          tRes.on('end', () => {
            console.log('Tickets:', tRes.statusCode, tBody);
          });
        });
        ticketsReq.end();
      });
    });
    loginReq.write(loginData);
    loginReq.end();
  });
});
req.write(registerData);
req.end();
