import { api } from "encore.dev/api";
import { demandDB } from "./db";

export interface ProductForecast {
  productId: string;
  productName: string;
  forecast: number;
  dmdStdev: number;
}

export interface ProductForecastResponse {
  products: ProductForecast[];
}

export const listProducts = api(
  { method: "GET", path: "/forecast/products", expose: true },
  async (): Promise<ProductForecastResponse> => {
    const sql = `SELECT product_id, product_name, forecast, dmd_stdev FROM product_data ORDER BY product_id`;
    const rows = await demandDB.rawQueryAll(sql);
    
    const products = rows.map(row => ({
      productId: row.product_id as string,
      productName: row.product_name as string,
      forecast: row.forecast as number,
      dmdStdev: row.dmd_stdev as number,
    }));
    
    return { products };
  }
);