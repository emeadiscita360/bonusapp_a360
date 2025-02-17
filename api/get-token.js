const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const { json } = require('express');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

const tenantId = process.env.TENANT_ID;
const resource = 'https://graph.microsoft.com/.default';  // Or your specific resource URL
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const targetApiEndpoint = 'https://prod-163.westus.logic.azure.com:443/workflows/8a6133daf6f84b5886380e6c62923730/triggers/manual/paths/invoke?api-version=2016-06-01';

app.use(json());  // Parse JSON data from requests
app.use(express.static('public'));  // Serve static files like index.html

// Simple route to test if the server is working
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
        console.log("Requesting token...");
        const tokenResponse = await axios.post(
            `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
            new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials',
                scope: resource // Microsoft Graph or your specific resource
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const accessToken = tokenResponse.data.access_token;
        console.log("Token received:", accessToken);
    } catch (error) {
        console.error("Error during token request:", error.response ? error.response.data : error.message);
        res.redirect('/index.html?success=false');
    }

    // Step 2: Send data to Power Automate (Azure Logic Apps)
    console.log("Sending data to Power Automate...");
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

    console.log("API Response from Power Automate:", apiResponse.status, apiResponse.data);

    // Step 3: Check response and return success/failure
    if (apiResponse.status === 200) {
        res.redirect(`/index.html?email=${email}&var1=${var1}&var2=${var2}&success=true`);
    } else {
        res.redirect('/index.html?success=false');
    }

} catch (error) {
    console.error("Error during token request or API call:", error.message);
    res.redirect('/index.html?success=false');
}
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
