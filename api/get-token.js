const express = require('express');
const axios = require('axios');
const app = express();

// Replace with your Azure AD credentials
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tenantId = process.env.TENANT_ID;
const resource = 'https://service.flow.microsoft.com/.default';

// Serve static HTML file from the "public" folder
app.use(express.static('public'));

// Endpoint to generate the Bearer token and send a POST request
app.get('/api/get-token', async (req, res) => {
    const { email, var1, var2 } = req.query;

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

        // Use the access token to call the target API
        const apiResponse = await axios.post(targetApiEndpoint, { email, var1, var2 }, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        // If the API call is successful, redirect with success=true
        res.redirect('/index.html?success=true');


    } catch (error) {
        console.error('Error in submit:', error.message);
        console.error('Full error:', error.response ? error.response.data : error.message);

        // On failure, redirect with success=false
        res.redirect('/index.html?success=false');
    }
});

// Vercel requires a default export
module.exports = app;

