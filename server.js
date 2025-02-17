const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables from the .env file
dotenv.config();

const app = express();
app.use(express.json()); // This allows us to parse JSON data in request bodies

// Replace with your Azure AD credentials and Power Automate endpoint
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tenantId = process.env.TENANT_ID;
const resource = 'https://service.flow.microsoft.com/.default';
const targetApiEndpoint = 'https://prod-163.westus.logic.azure.com:443/workflows/8a6133daf6f84b5886380e6c62923730/triggers/manual/paths/invoke?api-version=2016-06-01';

// Handle form submission via POST request
app.post('/api/get-token', async (req, res) => {
    console.log("Received request to /api/get-token");

    const { email, var1, var2 } = req.body;
    if (!email || !var1 || !var2) {
        console.log("Missing parameters, sending failure.");
        return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    try {
        // Step 1: Request an access token from Azure AD
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
        console.log("Azure Access Token:", accessToken);  // Debugging step

        // Step 2: Send data to Power Automate (Azure Logic Apps)
        const apiResponse = await axios.post(
            targetApiEndpoint,
            { email, var1, var2 },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Step 3: Check response and return success/failure
        if (apiResponse.status === 200) {
            res.json({ message: 'Data sent successfully', success: true });
        } else {
            res.json({ message: 'Failed to send data to Power Automate', success: false });
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'An error occurred', success: false });
    }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});