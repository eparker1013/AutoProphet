const axios = require('axios');
const { DOMParser } = require('xmldom');
const fs = require('fs');
const json2xls = require('json2xls');

const CIKNumber = '0000037996'; // '0001341439,0001326801,0000104169, 0001018724, 0000027419, 0000037996, 0001364742'
const strippedCIKNumber = CIKNumber.replace(/^0+/, '');
const filingType = '10-Q';
const baseURL = 'https://www.sec.gov';

const filingParameters = {
    action: 'getcompany',
    CIK: CIKNumber,
    type: filingType,
    dateb: '',
    owner: 'exclude',
    start: '',
    output: '',
    count: '100'
};

const header = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
};

// Constructing the URL
const queryString = new URLSearchParams(filingParameters).toString();
const url = `${baseURL}/cgi-bin/browse-edgar?${queryString}`;

// Making the HTTP GET request
axios.get(url, { headers: header })
    .then(response => {
        // Handle the response data here
        console.log('Response data:', response.data);
    })
    .catch(error => {
        // Handle errors here
        console.error('Error fetching data:', error);
    });

const getAPIResponse = async (url) => {
    try {
        const response = await axios.get(url, { headers: header });
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
};

const getFinancialData = async () => {
    try {
        // Get company details from the companyfacts API
        const apiResponse = await getAPIResponse(`https://data.sec.gov/api/xbrl/companyfacts/CIK${CIKNumber}.json`);
        const apiData = JSON.parse(apiResponse);
        console.log(`Company Name: ${apiData.entityName}`);

        // Get the report schema document for the particular company
        const submissionsResponse = await getAPIResponse(`https://data.sec.gov/submissions/CIK${CIKNumber}.json`);
        const submissionsData = JSON.parse(submissionsResponse);
        const submissionsDf = submissionsData.filings.recent.filter((filing) => filing.form === '10-Q' || filing.form === '10-K');
        const mostRecentReport = submissionsDf[0];
        const archivesPath = `/Archives/edgar/data/${strippedCIKNumber}/${mostRecentReport.accessionNumber}/${mostRecentReport.primaryDocument}_cal.xml`;

        // Retrieve financial data from the _cal.xml report schema document
        const schemaReportResponse = await getAPIResponse(`${baseURL}${archivesPath}`);
        const schemaReportParser = new DOMParser().parseFromString(schemaReportResponse, 'text/xml');
        const financialStatements = schemaReportParser.querySelectorAll('link:calculationLink[xlink:type="extended"]');
        const data = { statement: [] };

        for (const statement of financialStatements) {
            const statementName = statement.getAttribute('xlink:role').split('role/')[1].replace('Role_', '');
            const statementDictionary = { name: statementName, concept: [] };

            const concepts = statement.querySelectorAll('link:calculationArc[xlink:type="arc"]');

            for (const concept of concepts) {
                const sectionName = concept.getAttribute('xlink:from').match(/us-gaap_([a-zA-Z0-9]+)_?/)[1];
                const conceptName = concept.getAttribute('xlink:to').match(/us-gaap_([a-zA-Z0-9]+)_?/)[1];
                const conceptDictionary = {
                    section: sectionName,
                    name: conceptName,
                    data: apiData.facts['us-gaap'][conceptName],
                };
                statementDictionary.concept.push(conceptDictionary);
            }
            data.statement.push(statementDictionary);
        }

        // Process financial data
        const financialData = {};
        for (const statement of data.statement) {
            for (const concept of statement.concept) {
                const unit = Object.keys(concept.data.units)[0];
                for (const element of concept.data.units[unit]) {
                    if (element.end in financialData) {
                        financialData[element.end][concept.name] = element.val;
                    } else {
                        financialData[element.end] = { [concept.name]: element.val };
                    }
                }
            }
        }

        // Convert financial data to DataFrame
        const dfData = Object.keys(financialData).map((row) => {
            const record = financialData[row];
            return { ...record, Quarter: row, 'Revenue Increased': Math.random() < 0.5 ? 0 : 1 };
        });

        // Convert DataFrame to JSON and write to file
        const jsonData = JSON.stringify(dfData);
        fs.writeFileSync('financial_data.json', jsonData);

        // Convert JSON to Excel and write to file
        const xls = json2xls(dfData);
        fs.writeFileSync('financial_data.xlsx', xls, 'binary');

        console.log('Financial data successfully retrieved and saved.');
    } catch (error) {
        console.error('Error:', error);
    }
};

getFinancialData();
