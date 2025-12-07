import { Router } from "express";
import multer from "multer";
import { getCompanies, createCompany, getCompanyById, getEmployeesByCompanyId, createEmployeeForCompany, uploadCompanyLogo } from "../controllers/companies.controller.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get("/", getCompanies);
router.post("/", createCompany);
router.get("/:companyId", getCompanyById);
router.get("/:companyId/employees", getEmployeesByCompanyId);
router.post("/:companyId/employees", createEmployeeForCompany);
router.post("/:companyId/logo", upload.single("logo"), uploadCompanyLogo);

export default router;