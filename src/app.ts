import express from "express";
import clienteRoutes from "./routes/clienteRoutes.js";
import petRoutes from "./routes/petRoutes.js";
import agendamentoRoutes from "./routes/agendamentoRoutes.js";

const app = express();
app.use(express.json());
 
// =================
//  Root
// =================
app.get("/", (req, res) => {
    res.status(200).json({
        message: "API Petshop",
        version: "1.0.0"
    });
});
 
// =================
// Clientes
// =================
app.use("/clientes", clienteRoutes);
 
// =================
// Pets
// =================
app.use("/pets", petRoutes);
 
export default app;