import express from "express";
import cors from "cors";
import employeeRouter from "./routes/EmployeeRoute.js";
import laptopRouter from "./routes/LaptopRoute.js";


const app = express();
app.use(express.json());

app.use(cors())

app.use('/api', employeeRouter)
app.use("/api", laptopRouter)


app.listen(3000)