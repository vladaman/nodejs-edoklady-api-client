import fs from 'fs';
import superagent from 'superagent';
import dotenv from 'dotenv';
import {
    Agent
} from 'https'; // import HTTPS Agent for custom certificates

dotenv.config();

const API_URL = 'https://capi.edoklady.gov.cz';
const CACHE_FILE_PATH = './virtualni-prepazka.json';

class EdokladyApiClient {
    constructor(baseURL, certPath, passphrase, options = {}) {
        this.baseURL = baseURL;
        this.certPath = certPath; // Path to the PFX certificate
        this.passphrase = passphrase; // Passphrase for the PFX certificate
        this.options = options; // This can include headers, auth, etc.
        this.agent = new Agent({
            pfx: fs.readFileSync(this.certPath),
            passphrase: this.passphrase,
            rejectUnauthorized: true // Set to false if you want to ignore unauthorized certificates (not recommended)
        });
    }

    async requestServerFlowPresentation(data) {
        const response = await superagent
            .post(`${this.baseURL}/integration/presentation/server/requestPresentation`)
            .set('Content-Type', 'application/json; charset=utf-8')
            .set('X-Agent', 'OpenAI Agent')
            .agent(this.agent) // Use the custom HTTPS agent
            .send(data);
        return response.body;
    }

    async getServerFlowTransaction(serverFlowTransactionId) {
        const response = await superagent
            .get(`${this.baseURL}/integration/presentation/server/transactions/${serverFlowTransactionId}`)
            .set('Content-Type', 'application/json; charset=utf-8')
            .set('X-Agent', 'OpenAI Agent')
            .agent(this.agent) // Use the custom HTTPS agent
            .send();
        return response.body;
    }

    async getServerFlowTransactionResult(serverFlowTransactionId, includeMDoc) {
        const response = await superagent
            .get(`${this.baseURL}/integration/presentation/server/transactions/${serverFlowTransactionId}/result`)
            .set('Content-Type', 'application/json; charset=utf-8')
            .set('X-Agent', 'OpenAI Agent')
            .query({
                includeMDoc
            }) // Add query parameters
            .agent(this.agent) // Use the custom HTTPS agent
            .send();
        return response.body;
    }

    async requestBrowserPresentation(data) {
        const response = await superagent
            .post(`${this.baseURL}/integration/presentation/browser/requestPresentation`)
            .set('Content-Type', 'application/json; charset=utf-8')
            .set('X-Agent', 'OpenAI Agent')
            .agent(this.agent) // Use the custom HTTPS agent
            .send(data);
        return response.body;
    }

    async getBrowserFlowTransactionResult(code, includeMDoc) {
        const response = await superagent
            .post(`${this.baseURL}/integration/presentation/browser/result`)
            .set('Content-Type', 'application/json; charset=utf-8')
            .set('X-Agent', 'OpenAI Agent')
            .query({
                code,
                includeMDoc
            })
            .agent(this.agent) // Use the custom HTTPS agent
            .send();
        return response.body;
    }

    async listVirtualServiceCounters(page = 0, size = 10) {
        const response = await superagent
            .get(`${this.baseURL}/integration/virtualServiceCounters`)
            .set('Content-Type', 'application/json; charset=utf-8')
            .set('X-Agent', 'OpenAI Agent')
            .query({
                page,
                size
            })
            .agent(this.agent) // Use the custom HTTPS agent
            .send();
        return response.body;
    }

    async createVirtualServiceCounter(data) {
        const response = await superagent
            .post(`${this.baseURL}/integration/virtualServiceCounters`)
            .set('Content-Type', 'application/json; charset=utf-8')
            .set('X-Agent', 'OpenAI Agent')
            .agent(this.agent) // Use the custom HTTPS agent
            .send(data);
        return response.body;
    }

    async getVirtualServiceCounter(virtualServiceCounterId) {
        const response = await superagent
            .get(`${this.baseURL}/integration/virtualServiceCounters/${virtualServiceCounterId}`)
            .set('Content-Type', 'application/json; charset=utf-8')
            .set('X-Agent', 'OpenAI Agent')
            .agent(this.agent) // Use the custom HTTPS agent
            .send();
        return response.body;
    }

    // Add additional methods based on the OpenAPI spec...
}

const initializeApiClient = () => {
    return new EdokladyApiClient(
        API_URL,
        process.env.KEYSTORE_PATH, // Path to your PFX file
        process.env.PASSPHRASE // The passphrase for the PFX file
    );
};

const createVirtualServiceCounter = async (apiClient) => {
    // Check if the cache file exists
    if (fs.existsSync(CACHE_FILE_PATH)) {
        const cachedData = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf8'));
        
        // Check if the cached data is still valid
        const validTo = new Date(cachedData.qrCode.validTo);
        const now = new Date();

        if (now < validTo) {
            console.log('Returning cached Virtual Service Counter:', cachedData);
            return cachedData.id; // Return the cached id if it is still valid
        } else {
            console.log('Cached data expired.'); // Cache has expired
        }
    }

    // If the cache doesn't exist or is expired, create a new Virtual Service Counter
    const response = await apiClient.createVirtualServiceCounter({
        name: "MyCounter"
    });
    console.log('Virtual Service Counter Created:', response);

    // Write the JSON data to the cache file
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(response, null, 2));

    return response.id;
};


const requestServerFlowPresentation = async (apiClient, virtualServiceCounterId) => {
    const requestData = {
        requestDocuments: [{
            documentName: "org.iso.18013.5.1.CZ.mID",
            attributes: [{
                    name: "age_over_18",
                    intentToRetain: true
                },
                {
                    name: "portrait",
                    intentToRetain: true
                }
            ]
        }],
        virtualServiceCounterId: virtualServiceCounterId
    };

    const result = await apiClient.requestServerFlowPresentation(requestData);
    console.log('Request Server Flow Presentation Result:', result);
    return result.transactionId;
};

const getServerFlowTransactionResult = async (apiClient, transactionId, maxRetries = 20, delay = 3000) => {
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            // Call the method to fetch the transaction result using the transactionId
            const result = await apiClient.getServerFlowTransactionResult(transactionId);
            if (result) {
                console.log('Transaction Result is valid:', result);
                return result; // Return the valid result
            } else {
                console.log('Transaction Result is not valid yet. Retrying...');
            }
        } catch (error) {
            // Handle errors appropriately
            if (error.response) {
                console.error(`Error fetching transaction result: ${error.response.statusCode}`, error.response.body);
            } else {
                console.error(`Error fetching transaction result: ${error.message}`);
            }
        }

        // Increment the attempt counter and wait before the next retry
        attempts++;
        await new Promise(resolve => setTimeout(resolve, delay)); // Delay before retrying
    }

    throw new Error(`Transaction result for ID ${transactionId} did not become valid after ${maxRetries} attempts.`);
};


(async () => {

    const apiClient = initializeApiClient();

    try {
        let virtualCounterId = await createVirtualServiceCounter(apiClient); // Create a Counter, which you may need just one
        let transactionId = await requestServerFlowPresentation(apiClient, virtualCounterId); // Create new Transaction for each auth request
        let checkStatus = await getServerFlowTransactionResult(apiClient, transactionId);
        console.log('Recived status', JSON.stringify(checkStatus, null, 4));
    } catch (error) {
        if (error.response) {
            console.error(`Error: ${error.response.statusCode}`, error.response.body);
        } else {
            console.error(`Error: ${error.message}`);
        }
    }

})();
