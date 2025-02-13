const express = require('express');
const axios = require('axios');
const app = express();

// Replace with your Azure AD credentials
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tenantId = process.env.TENANT_ID;
const resource = 'https://service.flow.microsoft.com/.default';

// Endpoint to generate the Bearer token
app.get('/api/get-token', async (req, res) => {
    try {
        const tokenResponse = await axios.post(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
            scope: resource
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenResponse.data.access_token;
        res.json({ token: accessToken });
    } catch (error) {
        console.error('Error fetching token:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

// Vercel requires a default export
module.exports = app;

