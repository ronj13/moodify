const express = require('express');
const querystring = require('querystring');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 8888;

app.use(cors());
app.use(express.json());

// Environment variables
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

// Callback endpoint
app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;

    if (state === null) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
        return;
    }

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
            },
            body: querystring.stringify({
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            })
        });

        if (!response.ok) {
            throw new Error('Token request failed');
        }

        const data = await response.json();
        res.redirect(`${process.env.FRONTEND_URI}/?` +
            querystring.stringify({
                access_token: data.access_token,
                refresh_token: data.refresh_token
            }));
    } catch (error) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'invalid_token'
            }));
    }
});

// Generate random string for state parameter
const generateRandomString = (length) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

// Login endpoint
app.get('/login', (req, res) => {
    const state = generateRandomString(16);
    const scope = 'user-read-private user-read-email playlist-read-private';

    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});