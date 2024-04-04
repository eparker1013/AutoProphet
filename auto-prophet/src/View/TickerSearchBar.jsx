// No Warranty
// This software is provided "as is" without any warranty of any kind, express or implied. This includes, but is not limited to, the warranties of merchantability, fitness for a particular purpose, and non-infringement.
//
// Disclaimer of Liability
// The authors of this software disclaim all liability for any damages, including incidental, consequential, special, or indirect damages, arising from the use or inability to use this software.

import React, { useEffect } from "react";
import { StockInteractor } from "../Interactor/StockInteractor";
import { SecInteractor } from "../Interactor/SecInteractor";
import { JSONRequest } from "../Gateway/Request/JSONRequest";
import { SymbolSearchBar } from "./Shared/SymbolSearchBar";
import { CacheManager } from "../Utility/CacheManager";

function TickerSearchBar(props) {
    //Variables to reset the chart view
    var type;
    var interval;
    

    //TODO: implement error handling

    //When fetching data for a new ticker from the search bar, get 1D data
    const fetch1DData = async () => {
        type = "intraday";
        interval = "1D";
        fetchAllData();
    }

    //Gets all data for a ticker and updates the props with the data
    const fetchAllData = async () => {
        //Take away previous data
        props.onDataChange({
            initializing: false,
            error: props.state.error,
            data: null,
            secData: null,
            ticker: null,
            cik: null,
            type: props.state.type,
            interval: props.state.interval,
            securitiesList: props.state.securitiesList,
            searchRef: props.state.searchRef,
            isLoading: true,
            priceMin: null,
            priceMax: null,
            maxVolume: null,
            yAxisStart: null,
            yAxisEnd: null
        });

        //Initialize the new state
        var newState = {
            initializing: null,
            data: null,
            secData: null,
            error: null,
            ticker: null,
            cik: null,
            type: null,
            interval: null,
            securitiesList: props.state.securitiesList,
            searchRef: props.state.searchRef,
            isLoading: null,
            minPrice: null,
            maxPrice: null,
            maxVolume: null,
            yAxisStart: null,
            yAxisEnd: null
        };

        //Get Price Data
        await fetchPriceVolumeData(newState);
        //Get SEC Data
        await fetchSecData(newState);
    }

    //Gets price and volume data for a ticker
    const fetchPriceVolumeData = async (state) => {
        //get company name from securities list data
        var companyName = "";
        props.state.securitiesList.find((element) => {
            if(element.ticker === props.state.searchRef.current.value) {
                companyName = element.companyName;
            }
        });

        //get price and volume data through stock interactor
        var interactor = new StockInteractor();
        var requestObj = new JSONRequest(`{ 
            "request": { 
                "stock": {
                    "action": "${type}",
                    "ticker": "${props.state.searchRef.current.value}",
                    "companyName": "${companyName}",
                    "interval": "${interval}"
                }
            }
        }`);


            const results = await interactor.get(requestObj);
            var priceData = results;

            //Update the state
            state.initializing = true;
            state.data = priceData;
            state.ticker = props.state.searchRef.current.value;
            state.error = props.state.error;
            state.type = type;
            state.interval = interval;
            state.isLoading = false;
            state.priceMin = Math.min(...priceData.response.results[0]["data"].map(data => data.price));
            state.priceMax = Math.max(...priceData.response.results[0]["data"].map(data => data.price));
            state.maxVolume = Math.max(...priceData.response.results[0]["data"].map(data => data.volume));
            state.yAxisStart = dateTimeFormatter(priceData.response.results[0]["data"][0]);
            state.yAxisEnd = dateTimeFormatter(priceData.response.results[0]["data"][-1]);

            props.onDataChange(state);

    }

    //Gets SEC data for a ticker
    const fetchSecData = async (state) => {
        //TODO: consider whether the cachManager needs to be called here 
        //or if it could be called on cache extraction error
        
        //check to make sure ticker:CIK map cache exists and is up-to-date
        await props.cacheHandler(props.state.searchRef.current.value).then(async () => {
            //add a momentary pause to allow cache to create on initial startup
            // TODO: create a better way to wait for cache to completely resolve. Possibly useEffect()
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            await delay(1000);
            
            //get CIK from cache based on ticker symbol
            const cacheManager = new CacheManager();
            
            const tickerFolder = props.state.searchRef.current.value.toString().charAt(0).toLowerCase();
            var data = cacheManager.extractSync(`sec/${tickerFolder}/sec.json`);
            const tickerCikMap = JSON.parse(data);

            // remove the data to free memory
            data = null;

            // Make sure the ticker exists in the ticker:CIK mapping
            var cik;
            if(tickerCikMap["data"] !== undefined && tickerCikMap["data"].hasOwnProperty(props.state.searchRef.current.value.toLowerCase())) {
                cik = tickerCikMap["data"][props.state.searchRef.current.value.toLowerCase()];
            } else {
                // either the cache isn't set up or
                //the requested ticker is not from a company tracked by the SEC

                // TODO: if not a company tracked by the SEC, throw error or alert user of issue
                // TODO: come up with a better way than timeout above to wait for cache creation
                return;
            }
            
            //TODO: create a parent interactor that can send a single request and dispatch
            
            //get SEC data through SEC interactor
            var secInteractor = new SecInteractor();

            var secFormatRequestObj = new JSONRequest(`{
                "request": {
                    "sec": {
                        "action": "submissionsLookup",
                        "cik": "${cik}"
                    }
                }
            }`);

            const secSubmissionsResults = await secInteractor.get(secFormatRequestObj);
            window.terminal.log(JSON.stringify(secSubmissionsResults));

            var secCompanyRequestObj = new JSONRequest(`{ 
                "request": { 
                    "sec": {
                        "action": "companyLookup",
                        "cik": "${cik}"
                    }
                }
            }`);

            const secResults = await secInteractor.get(secCompanyRequestObj);
            window.terminal.log(JSON.stringify(secResults));

            //build the financial statements based on SEC submissions and company data
            var schema = await secInteractor.calculateReport(props.state.searchRef.current.value.toLowerCase(), secSubmissionsResults, secResults);
            
            window.console.dirxml(schema[0].response);

            //update the state
            state.secData = secResults;
            state.cik = cik;

            //Update the props
            props.onDataChange(state);
        });
    }

    //format the date and time for chart
    const dateTimeFormatter = (value) => {
        const date = new Date(value);
        
        if( props.state.type === "intraday") {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        } else {
            const dateNoMinutes = date.getDate().toString();
            return dateNoMinutes;
        }
    };

    //fetch data when the interval is changed by the interval buttons in TimeSeriesChart
    useEffect(() => {
        //stops fetchData() from being called upon page start
        if(props.state.initializing === false) {
            //Get new type and interval for which to format data
            type = props.state.type;
            interval = props.state.interval;
            
            fetchAllData();
        }
    }, [props.state.interval]);

    const handleSymbolChange = (state) => {
        props.onDataChange(state);
    };
   
    return (
        <SymbolSearchBar fetchData={fetch1DData} state={props.state} onSymbolChange={handleSymbolChange}/>
    );
}

export { TickerSearchBar }