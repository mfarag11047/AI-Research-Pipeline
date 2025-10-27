// IMPORTANT: You must generate your own Google Cloud API Key and OAuth 2.0 Client ID.
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project.
// 3. Go to "APIs & Services" > "Credentials".
// 4. Create an "API key" and paste it below.
// 5. Create an "OAuth 2.0 Client ID" for a "Web application".
//    - Add "http://localhost:5173" (or your development URL) to "Authorized JavaScript origins".
//    - Add "http://localhost:5173" (or your development URL) to "Authorized redirect URIs".
//    - Copy the "Client ID" and paste it below.
// 6. Go to "APIs & Services" > "Library" and enable the following APIs:
//    - Google Drive API
//    - Google Picker API
//    - Google Sheets API

// Replace with your actual API Key (Using 'GenAI Key' from your screenshot, but you should create a new one)
export const API_KEY = 'AIzaSy...[REDACTED_FOR_SECURITY]'; // Please use a NEW, SECURE API KEY

// Replace with your actual Client ID (Using 'Web client 2' from your screenshot)
export const CLIENT_ID = '513924525853-c1eq...[REDACTED_FOR_SECURITY].apps.googleusercontent.com'; // Please use your NEW CLIENT ID

// The scopes define the permissions the app will request from the user.
export const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets';