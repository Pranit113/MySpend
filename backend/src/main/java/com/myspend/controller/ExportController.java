package com.myspend.controller;

import com.myspend.service.PdfExportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final PdfExportService pdfService;

    public ExportController(PdfExportService pdfService) {
        this.pdfService = pdfService;
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) throws Exception {

        if (startDate.isAfter(endDate)) {
            return ResponseEntity.badRequest().build();
        }

        byte[] pdf = pdfService.generate(startDate, endDate);
        String filename = "myspend_" + startDate + "_to_" + endDate + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdf);
    }
}
