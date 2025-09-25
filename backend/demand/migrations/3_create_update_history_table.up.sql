CREATE TABLE demand_update_history (
  id BIGSERIAL PRIMARY KEY,
  month_year TEXT,
  product_id TEXT,
  customer_id TEXT,
  percentage DOUBLE PRECISION NOT NULL,
  description TEXT NOT NULL,
  records_affected INTEGER NOT NULL,
  sql_query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_demand_update_history_created_at ON demand_update_history(created_at DESC);
