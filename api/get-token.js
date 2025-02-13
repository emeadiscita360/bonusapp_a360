const express = require('express');
const axios = require('axios');
const app = express();

// Load environment variables
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tenantId = process.env.TENANT_ID;
const resource = 'https://service.flow.microsoft.com/.default';

// Serve static files (like index.html)
app.use(express.static('public'));

// Endpoint to generate the Bearer token and send a POST request
app.get('/api/get-token', async (req, res) => {
    const { email, var1, var2 } = req.query;

    // Check if required parameters exist
    if (!email || !var1 || !var2) {
        return res.redirect('/index.html?success=false');
    }

    try {
        // Step 1: Get Access Token
        const tokenResponse = await axios.post(
            `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
            new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials',
                scope: resource
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );

        const accessToken = tokenResponse.data.access_token;

        // Step 2: Send Data to Azure Logic App
        const targetApiEndpoint = 'https://prod-163.westus.logic.azure.com:443/workflows/8a6133daf6f84b5886380e6c62923730/triggers/manual/paths/invoke?api-version=2016-06-01';

        await axios.post(targetApiEndpoint,
            { email, var1, var2 },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Encode query parameters before redirecting
        const encodedEmail = encodeURIComponent(email);
        const encodedVar1 = encodeURIComponent(var1);
        const encodedVar2 = encodeURIComponent(var2);

        // Redirect to index.html with success=true and encoded parameters
        res.redirect(`/index.html?email=${encodedEmail}&var1=${encodedVar1}&var2=${encodedVar2}&success=true`);

    } catch (error) {
        console.error('Error in submit:', error.message);
        console.error('Full error:', error.response ? error.response.data : error.message);

        // Redirect to index.html with failure message
        res.redirect('/index.html?success=false');
    }
});

// Export for Vercel
module.exports = app;
