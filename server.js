const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
//1
// Replace with your Azure AD credentials
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tenantId = process.env.TENANT_ID;
const resource = process.env.RESOURCE;

// The target endpoint to send data to (replace this with your actual Power Automate or Logic Apps trigger URL)
const targetApiEndpoint = 'https://prod-xx.westus.logic.azure.com:443/workflows/xxxxxxxxxx/triggers/manual/paths/invoke?api-version=2016-06-01';

// Endpoint to generate the Bearer token and send data to Power Automate
app.post('/api/submit', async (req, res) => {
    const { email, var1, var2 } = req.body;

    try {
        // Get token from Azure AD
        const tokenResponse = await axios.post(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
            scope: resource
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenResponse.data.access_token;

        // Use the access token to call the Power Automate/Logic App endpoint
        const apiResponse = await axios.post(targetApiEndpoint, { email, var1, var2 }, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        // Return a response after successful submission
        res.json({ message: 'Data submitted successfully', email, var1, var2 });
    } catch (error) {
        console.error('Error in submit:', error.message);
        res.status(500).json({ error: 'Failed to process the request' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});