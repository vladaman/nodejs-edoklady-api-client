# Installation & Running the Application

To install and run the application, follow these steps:

```bash
npm install
node app.js
```

## Prerequisites

Before you start, ensure you have the following setup:

1. **Export the Certification Chain**: Obtain the certification chain for your commercial certificate from I.CA by visiting [I.CA](https://www.ica.cz/).
2. **Upload the Certificate**: After exporting the certification chain, upload it to the entity you wish to access at [Správa certifikátů API](https://sprava.edoklady.gov.cz/nastaveni).
3. **Create a `.env` File**: Set up a `.env` file in the root directory of your project with the path to your PFX file and its passphrase. The contents of the `.env` file should look like this:

   ```
    KEYSTORE_PATH=./my-keystore.pfx
    PASSPHRASE=pass
   ```

4. **Extract the Private Key** (if needed): If required, you can extract the private key from your PFX file using the following OpenSSL command:

   ```bash
   openssl pkcs12 -in yourfile.pfx -nocerts -out private_key.pem
   ```

## Important Notes

- If you receive a **401 Unauthorized** error while accessing the application, it may indicate one of the following issues:
  - You are trying to access an entity that you do not have permission to access.
  - Your certification chain has not been uploaded correctly.

Please double-check your access rights and ensure that your certificate is properly configured.


# Example

```javascript
(async () => {

    const apiClient = initializeApiClient();

    try {
        let virtualCounterId = await createVirtualServiceCounter(apiClient); // Create a Counter, which you may need just one
        let transactionId = await requestServerFlowPresentation(apiClient, virtualCounterId); // Create new Transaction for each auth request
        let checkStatus = await getServerFlowTransactionResult(apiClient, transactionId);
    } catch (error) {
        if (error.response) {
            console.error(`Error: ${error.response.statusCode}`, error.response.body);
        } else {
            console.error(`Error: ${error.message}`);
        }                                                                                                                                                                                                                                                
    }

})();
```


## A Note on Our Lovely Journey with Government APIs

Ah, integrating government APIs—truly the pinnacle of modern-day joy! If you’ve ever wanted to experience the thrill of deciphering poorly documented endpoints, wrestling with cryptic error messages, and waiting for responses longer than your last relationship, then you’re in the right place!

Welcome to our project, where every API call is like a delightful game of “Will it work today?” Spoiler alert: it rarely does! 

As you dive into this exhilarating adventure, just remember:

- **Patience is Key**: Just like waiting for that long-overdue tax refund, expect to wait for responses from these APIs. Grab a snack, binge-watch a series, or contemplate the meaning of life while you wait.

- **Error Codes are Your Friends**: Forget about friendly error messages. Here, we relish in the joy of vague codes that make you feel like you’ve just stumbled into a secret society where the initiation involves a lot of Googling and a touch of existential dread.

- **Documentation? What Documentation?**: You’ll find that the government has a unique approach to documentation—think of it as a choose-your-own-adventure book... but with missing pages and plot holes the size of a black hole.

- **Access Denied?**: Ah, the sweet taste of a 401 error. It’s like getting locked out of a party you were never invited to in the first place. Who knew that bureaucratic access controls could feel so personal?

So, buckle up and prepare for a ride through the wild, wonderful world of government APIs. It’s a journey filled with excitement, confusion, and the occasional urge to throw your computer out the window. But hey, at least you’ll have some great stories to tell at parties (if anyone dares to invite you after hearing about your API escapades)!

Happy coding, and may the odds be ever in your favor (you’ll need them)!
