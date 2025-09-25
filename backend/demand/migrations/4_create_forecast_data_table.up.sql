CREATE TABLE forecast_data (
  id BIGSERIAL PRIMARY KEY,
  demand_period DATE NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_forecast_data_product_id ON forecast_data(product_id);
CREATE INDEX idx_demand_period ON forecast_data(demand_period);
