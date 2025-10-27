import { API_KEY, CLIENT_ID, SCOPES } from '../googleApiConfig';
import { ProductSchema } from '../types';

declare global {
    interface Window {
        gapi: any;
        google: any;
        tokenClient: any;
    }
}

let gapiInited = false;
let gisInited = false;

/**
 * Initializes the GAPI client for Google Sheets API.
 */
export const initGapiClient = (callback: () => void) => {
    window.gapi.load('client:picker', () => {
        window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        }).then(() => {
            gapiInited = true;
            callback();
        });
    });
};

/**
 * Initializes the Google Identity Services client for OAuth2.
 */
export const initGisClient = (callback: (tokenResponse: any) => void) => {
    window.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: callback,
    });
    gisInited = true;
};

/**
 * Prompts the user to sign in and grant permissions.
 */
export const handleAuthClick = () => {
    if (gapiInited && gisInited) {
        if (window.gapi.client.getToken() === null) {
            window.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            window.tokenClient.requestAccessToken({ prompt: '' });
        }
    } else {
        alert('GAPI or GIS not initialized yet.');
    }
};

/**
 * Signs the user out.
 */
export const handleSignoutClick = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
        window.google.accounts.oauth2.revoke(token.access_token, () => {
            window.gapi.client.setToken('');
        });
    }
};

const SHEET_HEADER = [
    'product_id', 'product_name', 'category', 'price_usd', 
    'summary_description', 'summary_pros', 'summary_cons',
    'specifications', 'review_urls', 'retail_urls', 'research_date'
];

const flattenProduct = (product: ProductSchema): (string | number | null)[] => {
    return [
        product.product_id,
        product.product_name,
        product.category,
        product.price_usd,
        product.summary.description,
        product.summary.pros.join('\n'), // Join arrays into newline-separated strings
        product.summary.cons.join('\n'),
        JSON.stringify(product.specifications, null, 2), // Stringify specs object
        product.source_info.review_urls.join('\n'),
        product.source_info.retail_urls.join('\n'),
        product.source_info.research_date,
    ];
};

/**
 * Appends data to the specified Google Sheet. Creates a header if the sheet is empty.
 */
export const appendToSheet = async (spreadsheetId: string, data: ProductSchema[]) => {
    try {
        // Check if sheet is empty to add header
        const getResponse = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Sheet1!A1:A1',
        });

        const rowsToAppend = data.map(flattenProduct);

        if (!getResponse.result.values || getResponse.result.values.length === 0) {
            // Sheet is empty, add header first
            await window.gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: spreadsheetId,
                range: 'Sheet1',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [SHEET_HEADER, ...rowsToAppend],
                },
            });
        } else {
            // Sheet has data, just append new rows
            await window.gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: spreadsheetId,
                range: 'Sheet1',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: rowsToAppend,
                },
            });
        }
    } catch (err: any) {
        console.error('Error appending to sheet:', err.result.error.message);
        throw new Error('Failed to save data to Google Sheet.');
    }
};

/**
 * Uses Google Picker to let the user create or select a spreadsheet.
 */
export const createOrPickFile = (callback: (file: {id: string, name: string}) => void) => {
    const accessToken = window.gapi.client.getToken().access_token;
    const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
    view.setMimeTypes("application/vnd.google-apps.spreadsheet");
    
    const picker = new window.google.picker.PickerBuilder()
        .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
        .setAppId(CLIENT_ID.split('-')[0])
        .setOAuthToken(accessToken)
        .addView(view)
        .addView(new window.google.picker.DocsUploadView())
        .setCallback((data: any) => {
            if (data.action === window.google.picker.Action.PICKED) {
                const doc = data.docs[0];
                callback({ id: doc.id, name: doc.name });
            }
        })
        .build();
    picker.setVisible(true);
};
