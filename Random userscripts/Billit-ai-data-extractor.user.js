// ==UserScript==
// @name         Billit Invoice AI data extractor
// @version      1.4
// @description  Extracts various data from the images in Snelle Invoer by sending it to through openai
// @author       Thibaultmol
// @description  Extract invoice data using OpenAI API
// @match        https://my.breex.be/*
// @match        https://my.billit.be/*
// @updateURL    https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Billit-ai-data-extractor.user.js
// @downloadURL  https://raw.githubusercontent.com/thibaultmol/random-shit/main/Random%20userscripts/Billit-ai-data-extractor.user.js
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @connect      api.openai.com
// ==/UserScript==

(function() {
    'use strict';

    // Helper functions for cookie management
    function setCookie(name, value, minutes) {
        const maxAge = minutes * 60;
        document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Strict`;
    }

    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    }

    // Add button to the page
    function addButton() {
        const buttonContainer = document.querySelector('.d-sm-flex.justify-content-xl-end');
        if (!buttonContainer) return;

        // Check if button already exists
        if (document.getElementById('btnBillitAI')) return;

        const button = document.createElement('button');
        button.id = 'btnBillitAI';
        button.type = 'button';
        button.className = 'btn btn-primary btn-block btn-sm-inline mb-1 mb-sm-0 mr-sm-1';
        button.textContent = 'Billit AI';
        button.onclick = extractInvoice;

        // Insert as first child (leftmost button)
        buttonContainer.insertBefore(button, buttonContainer.firstChild);
    }

    // Wait for page to load and add button
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addButton);
    } else {
        addButton();
    }

    async function extractInvoice() {
        let API_KEY = getCookie('openai_api_key');

        if (!API_KEY) {
            API_KEY = prompt("Please enter your OpenAI API key:");
            if (!API_KEY) return;
            setCookie('openai_api_key', API_KEY, 10);
        }

        try {
            const imgElement = document.evaluate('//*[@id="pdfImage"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (!imgElement) throw new Error("Image not found");

            const response = await fetch(imgElement.src);
            const blob = await response.blob();
            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(blob);
            });

            if (!base64) throw new Error("Failed to convert image to base64");

            const apiBody = {
                model: "gpt-5-mini",
                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Extract from the invoice ONLY these 4 things:\n- invoice number\n- invoice date (dd/mm/yyyy)\n- payment description: Either the invoice has something in this format +++090/9337/55493+++ OR if that's not present on the invoice, create a text which is \"Factuur [invoicenr] datum [invoice date] klantnr [customer id]\"\n- A ultra short list of items listed on the invoice with comma's in between (only 4 items)"
                        },
                        {
                            type: "image_url",
                            image_url: { url: `data:image/jpeg;base64,${base64}` }
                        }
                    ]
                }],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "invoice_extraction",
                        schema: {
                            type: "object",
                            properties: {
                                invoiceNumber: { type: "string" },
                                invoiceDate: { type: "string" },
                                paymentDescription: { type: "string" },
                                itemsList: { type: "string" }
                            },
                            required: ["invoiceNumber", "invoiceDate", "paymentDescription", "itemsList"],
                            additionalProperties: false
                        },
                        strict: true
                    }
                }
            };

            GM.xmlHttpRequest({
                method: 'POST',
                url: 'https://api.openai.com/v1/chat/completions',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(apiBody),
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);

                        if (response.status !== 200) {
                            throw new Error(data.error?.message || 'API call failed');
                        }

                        if (data.choices[0].message.refusal) {
                            throw new Error(`API refused: ${data.choices[0].message.refusal}`);
                        }

                        let result = data.choices[0].message.content;
                        if (typeof result === 'string') result = JSON.parse(result);

                        const fields = {
                            '//*[@id="NewOrder_OrderNumber"]': result.invoiceNumber,
                            '//*[@id="NewOrder_OrderDate"]': result.invoiceDate,
                            '//*[@id="NewOrder_PaymentReference"]': result.paymentDescription,
                            '//*[@id="NewOrder_OrderTitle"]': result.itemsList,
                            '//*[@id="NewOrder_Reference"]': "Te controleren"
                        };

                        for (const [xpath, value] of Object.entries(fields)) {
                            const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                            if (!element) continue;
                            element.value = value;
                            element.dispatchEvent(new Event('change', { bubbles: true }));
                        }

                    } catch (error) {
                        console.error("Error:", error);
                        alert('Error: ' + error.message);
                    }
                },
                onerror: function(error) {
                    console.error("Request failed:", error);
                    alert('Request failed');
                }
            });

        } catch (error) {
            console.error("Error:", error);
            alert('Error: ' + error.message);
        }
    }
})();
