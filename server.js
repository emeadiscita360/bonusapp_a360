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
const targetApiEndpoint = 'https://prod-163.westus.logic.azure.com:443/workflows/8a6133daf6f84b5886380e6c62923730/triggers/manual/paths/invoke?api-version=2016-06-01';

// Endpoint to generate the Bearer token
app.post('/api/get-token', async (req, res) => {
    try {
        const tokenResponse = await axios.post(
            `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
            new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials',
                scope: resource
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const accessToken = tokenResponse.data.access_token;
        res.json({ token: accessToken });  // Return the token to the client
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

// Endpoint to send data to Power Automate (or any target API)
app.post('/api/send-data', async (req, res) => {
    const { email, var1, var2 } = req.body;

    try {
        // Get the access token
        const tokenResponse = await axios.post(
            `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
            new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials',
                scope: resource
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const accessToken = tokenResponse.data.access_token;

        // Use the token to make a request to your target API (Power Automate or custom API)
        const apiResponse = await axios.post(
            'https://prod-163.westus.logic.azure.com:443/workflows/8a6133daf6f84b5886380e6c62923730/triggers/manual/paths/invoke?api-version=2016-06-01',
            { email, var1, var2 },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({ message: 'Data sent successfully' });
    } catch (error) {
        console.error('Error sending data:', error.message);
        res.status(500).json({ error: 'Failed to forward data' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});