import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Layout from "./components/Layout";
import DemandUpload from "./pages/DemandUpload";
import ModifyDemand from "./pages/ModifyDemand";
import Forecast from "./pages/Forecast";
import Inventory from "./pages/Inventory";
import EOQCalculation from "./pages/EOQCalculation";
import PurchaseOrders from "./pages/PurchaseOrders";
import ReceiveProducts from "./pages/ReceiveProducts";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import Database from "./pages/Database";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Layout>
          <Routes>
            <Route path="/" element={<DemandUpload />} />
            <Route path="/modify-demand" element={<ModifyDemand />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/eoq-calculation" element={<EOQCalculation />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/receive-products" element={<ReceiveProducts />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/database" element={<Database />} />
          </Routes>
        </Layout>
        <Toaster />
      </div>
    </Router>
  );
}
