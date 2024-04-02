import {IEntity} from "../../Entity/IEntity";
import { IKeylessDataGateway } from "./IKeylessDataGateway";

const yfinance = require('yfinance');

export class YFinanceStockGateway implements IKeylessDataGateway {
    constructor() {}
  connect(): void {
    throw new Error("Method not implemented.");
  }
  disconnect(): void {
    throw new Error("Method not implemented.");
  }
  create(entity: IEntity, action: string): Promise<Boolean> {
    throw new Error("Method not implemented.");
  }
  read(entity: IEntity, action: string): Promise<IEntity[]> {
    throw new Error("Method not implemented.");
  }
  update(entity: IEntity, action: string): Promise<number> {
    throw new Error("Method not implemented.");
  }
  delete(entity: IEntity, action: string): Promise<number> {
    throw new Error("Method not implemented.");
  }
  key?: string;

    async searchSymbol(keyword: any) {
        try {
            const searchResult = await yfinance.search(keyword);
            const symbols = searchResult.map((result: { symbol: any; shortName: any; }) => ({
                ticker: result.symbol,
                companyName: result.shortName
            }));
            return symbols;
        } catch (error) {
            throw new Error("Error occurred while searching for symbols: " + error.message);
        }
    }

    async getIntradayData(ticker: any) {
        try {
            const data = await yfinance.getQuotes(ticker);
            return this.formatData(data, "intraday");
        } catch (error) {
            throw new Error("Error occurred while fetching intraday data: " + error.message);
        }
    }

    async getInterdayData(ticker: any) {
        try {
            const data = await yfinance.getHistoricalPrices(ticker, {
                period: '1d'
            });
            return this.formatData(data, "interday");
        } catch (error) {
            throw new Error("Error occurred while fetching interday data: " + error.message);
        }
    }

    formatData(data: any[], type: string) {
        if (!data || data.length === 0) {
            throw new Error("No data available");
        }

        const formattedData = data.map((item: { date: any; close: any; volume: any; }) => ({
            date: item.date,
            price: item.close,
            volume: item.volume
        }));

        return [{
            type: type,
            data: formattedData
        }];
    }
}



// Example usage:
const gateway = new YFinanceStockGateway();

// Search for symbols
gateway.searchSymbol('apple')
    .then(symbols => console.log("Symbol search result:", symbols))
    .catch(error => console.error("Error:", error.message));

// Get intraday data
gateway.getIntradayData('AAPL')
    .then(data => console.log("Intraday data:", data))
    .catch(error => console.error("Error:", error.message));

// Get interday data
gateway.getInterdayData('AAPL')
    .then(data => console.log("Interday data:", data))
    .catch(error => console.error("Error:", error.message));