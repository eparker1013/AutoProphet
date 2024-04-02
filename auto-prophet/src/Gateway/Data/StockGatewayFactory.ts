import { AlphaVantageStockGateway } from "@DataGateway/AlphaVantageStockGateway";
import { YFinanceStockGateway } from "@DataGateway/YFinanceStockGateway";
import { IDataGateway } from "./IDataGateway";
import { EnvVariableExtractor } from "../../Utility/EnvVariableExtractor";

export class StockGatewayFactory {
    async createGateway(config: any): Promise<IDataGateway> {
        const extractor = new EnvVariableExtractor();
        
        //TODO: add other gateways, such as Yahoo Finance API
        if(config["StockGateway"] === "AlphaVantageStockGateway") {
            const key = await extractor.extract("ALPHAVANTAGE_API_KEY");
            return new AlphaVantageStockGateway(key);
        } 
        // For YFinance Gateway
        else if (config["StockGateway"] === "YFinanceStockGateway"){
            return  new YFinanceStockGateway();
        } else {
            //default will be AlphaVantage for now
            const key = await extractor.extract("ALPHAVANTAGE_API_KEY");
            return new AlphaVantageStockGateway(key);
        }
    }
}