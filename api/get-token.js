const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = 3000;

const tenantId = process.env.TENANT_ID;
const resource = 'https://graph.microsoft.com/.default';  // Or your specific resource URL
const targetApiEndpoint = 'https://prod-163.westus.logic.azure.com:443/workflows/8a6133daf6f84b5886380e6c62923730/triggers/manual/paths/invoke?api-version=2016-06-01';

app.use(express.static('public'));  // Serve static files like index.html

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.get('/api/get-token', async (req, res) => {
    console.log("Received request to /api/get-token");

    const { email, var1, var2 } = req.query;
    if (!email || !var1 || !var2) {
        console.log("Missing parameters, sending failure.");
        return res.json({ success: false, message: "Missing parameters" });
    }

    try {
        // Step 1: Request an access token from Azure AD
        console.log("Requesting token...");
        const tokenResponse = await axios.post(
            `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
            new URLSearchParams({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'client_credentials',
                scope: resource
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        // Step 2: If token response is successful, get the access token
        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            console.error("Failed to get access token");
            return res.redirect('/index.html?success=false');
        }

        console.log("Token received:", accessToken);

        // Step 3: Trigger Power Automate (Azure Logic App) Flow
        console.log("Triggering Power Automate Flow...");

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

        // Step 4: Check response from Power Automate and redirect accordingly
        if (apiResponse.status === 200) {
            console.log("Power Automate flow triggered successfully");
            res.redirect(`/index.html?email=${email}&var1=${var1}&var2=${var2}&success=true`);
        } else {
            console.error("Failed to trigger Power Automate flow", apiResponse.data);
            res.redirect('/index.html?success=false');
        }

    } catch (error) {
        // Log the error from the token request or API call
        console.error("Error during token request or API call:", error.response ? error.response.data : error.message);
        res.redirect('/index.html?success=false');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
