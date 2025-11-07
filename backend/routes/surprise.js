import express from "express";
import { searchSurprise, getPriceRange } from "../controllers/surpriseController.js";


const router = express.Router();

router.get("/price-range", getPriceRange);
router.post("/", searchSurprise);



export default router;
