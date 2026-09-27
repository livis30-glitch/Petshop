import express from "express";
import Cliente from "./models/Cliente.js";
import Pet from "./models/Pet.js";

const app = express();
app.use(express.json());

// =================
// Root
// =================
app.get("/", (req, res) => {
    res.status(200).json({
        message: "API Petshop",
        version: "1.0.0"
    });
});

export default app;