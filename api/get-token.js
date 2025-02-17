const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = 3000;

const tenantId = process.env.TENANT_ID;  // Ensure these are in your .env
const resource = 'https://graph.microsoft.com/.default';  // Or your specific resource URL

app.use(express.static('public'));  // Serve static files like index.html

// Simple route to test if the server is working
app.get('/', (req, res) => {
    res.send('Server is running');
});

app.get('/api/get-token', async (req, res) => {
    console.log("Received request to /api/get-token");
    console.log("This is a log message");

    const { email, var1, var2 } = req.query;
    if (!email || !var1 || !var2) {
        console.log("Missing parameters, sending failure.");
        return res.json({ success: false, message: "Missing parameters" });
    }

    try {
        console.log("Requesting token...");
        const tokenResponse = await axios.post(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'client_credentials',
            scope: resource
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenResponse.data.access_token;
        console.log("Token received:", accessToken);

        res.redirect(`/index.html?email=${email}&var1=${var1}&var2=${var2}&success=true`);

    } catch (error) {
        console.error("Request failed:", error.message);
        res.redirect('/index.html?success=false');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
