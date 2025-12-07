import { Router } from "express";
import multer from "multer";
import { createEmployeeDocuments, getEmployeeDetails, updateEmployeeDetails, uploadEmployeeAvatar, getEmployeeDocuments, downloadEmployeeDocument, previewEmployeeDocument } from "../controllers/employees.controller.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post("/:employeeId/documents", createEmployeeDocuments);
router.get("/:employeeId", getEmployeeDetails);
router.patch("/:employeeId", updateEmployeeDetails);
router.post("/:employeeId/avatar", upload.single("file"), uploadEmployeeAvatar);
router.get("/:employeeId/documents", getEmployeeDocuments);
router.get("/:employeeId/documents/preview", previewEmployeeDocument);
router.get("/:employeeId/documents/:documentId/download", downloadEmployeeDocument);

export default router;