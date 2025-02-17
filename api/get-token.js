import express from 'express';
import { post } from 'axios';
import { config } from 'dotenv';
import { URLSearchParams } from 'url';

// Load environment variables from the .env file
config();

const app = express();
app.use(express.json()); // Allows us to parse JSON data in request bodies
app.use(express.static('public')); // Serve static files like index.html

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const tenantId = process.env.TENANT_ID;
const resource = 'https://graph.microsoft.com/.default';  // Or your specific resource URL
const targetApiEndpoint = 'https://prod-163.westus.logic.azure.com:443/workflows/8a6133daf6f84b5886380e6c62923730/triggers/manual/paths/invoke?api-version=2016-06-01';

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.get('/api/get-token', async (req, res) => {
    console.log("Received request to /api/get-token");

    // Extract the query parameters
    const { email, var1, var2 } = req.query;
    if (!email || !var1 || !var2) {
        console.log("Missing parameters, sending failure.");
        return res.redirect(`/index.html?email=${email || "N/A"}&var1=${var1 || "N/A"}&var2=${var2 || "N/A"}&success=false`);
    }

    try {
        console.log("Requesting token from Azure AD...");

        // Request the access token from Azure AD
        const tokenResponse = await post(
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
        console.log("Token received:", accessToken);

        // Step 2: Send data to Power Automate
        const apiResponse = await post(
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

        // Step 3: Check the response and redirect accordingly
        if (apiResponse.status === 200) {
            // If the API call is successful, redirect with success=true
            return res.redirect(`/index.html?email=${email}&var1=${var1}&var2=${var2}&success=true`);
        } else {
            // If the API call fails, redirect with success=false
            console.error("Failed to send data to Power Automate:", apiResponse.statusText);
            return res.redirect(`/index.html?email=${email}&var1=${var1}&var2=${var2}&success=false`);
        }
    } catch (error) {
        console.error("Error:", error.message);
        // If there's an error, redirect with success=false
        return res.redirect(`/index.html?email=${email}&var1=${var1}&var2=${var2}&success=false`);
    }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
