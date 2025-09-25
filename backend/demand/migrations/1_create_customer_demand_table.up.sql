CREATE TABLE customer_demand (
  id BIGSERIAL PRIMARY KEY,
  demand_date DATE NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customer_demand_product_id ON customer_demand(product_id);
CREATE INDEX idx_customer_demand_customer_id ON customer_demand(customer_id);
CREATE INDEX idx_customer_demand_date ON customer_demand(demand_date);
