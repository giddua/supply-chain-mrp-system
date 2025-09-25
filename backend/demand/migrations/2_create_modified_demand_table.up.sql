CREATE TABLE modified_demand_data (
  id BIGSERIAL PRIMARY KEY,
  demand_date DATE NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_modified_demand_product_id ON modified_demand_data(product_id);
CREATE INDEX idx_modified_demand_customer_id ON modified_demand_data(customer_id);
CREATE INDEX idx_modified_demand_date ON modified_demand_data(demand_date);
