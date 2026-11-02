package com.myspend.service;

import com.myspend.entity.Transaction;
import com.myspend.entity.Transaction.TransactionType;
import com.myspend.repository.SettingsRepository;
import com.myspend.repository.TransactionRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class PdfExportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final Color TEAL = new Color(0, 128, 128);
    private static final Color LIGHT_GRAY = new Color(245, 245, 245);
    private static final float MARGIN = 50f;
    private static final float PAGE_WIDTH = PDRectangle.A4.getWidth();
    private static final float CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

    private final TransactionRepository transactionRepo;
    private final SettingsRepository settingsRepo;

    public PdfExportService(TransactionRepository transactionRepo, SettingsRepository settingsRepo) {
        this.transactionRepo = transactionRepo;
        this.settingsRepo = settingsRepo;
    }

    public byte[] generate(LocalDate startDate, LocalDate endDate) throws Exception {
        var settings = settingsRepo.findFirstBy().orElseGet(com.myspend.entity.Settings::new);
        BigDecimal openingBalance = settings.getOpeningBalance();

        // All-time totals before startDate for running balance
        BigDecimal incomeBeforeStart = transactionRepo.sumByTypeAndDateBetween(
                TransactionType.INCOME, LocalDate.of(2000, 1, 1), startDate.minusDays(1));
        BigDecimal expenseBeforeStart = transactionRepo.sumByTypeAndDateBetween(
                TransactionType.EXPENSE, LocalDate.of(2000, 1, 1), startDate.minusDays(1));
        BigDecimal periodOpeningBalance = openingBalance.add(incomeBeforeStart).subtract(expenseBeforeStart);

        List<Transaction> transactions = transactionRepo.findByTransactionDateBetweenOrderByTransactionDateAsc(startDate, endDate);

        BigDecimal totalIncome = transactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal closingBalance = periodOpeningBalance.add(totalIncome).subtract(totalExpense);

        Map<LocalDate, List<Transaction>> byDate = transactions.stream()
                .collect(Collectors.groupingBy(Transaction::getTransactionDate, TreeMap::new, Collectors.toList()));

        try (PDDocument doc = new PDDocument()) {
            PdfWriter writer = new PdfWriter(doc);
            writer.writeReport(startDate, endDate, periodOpeningBalance, byDate,
                    totalIncome, totalExpense, closingBalance);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    private static class PdfWriter {
        private final PDDocument doc;
        private PDPage page;
        private PDPageContentStream cs;
        private float y;
        private final PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        private final PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

        PdfWriter(PDDocument doc) throws Exception {
            this.doc = doc;
            newPage();
        }

        private void newPage() throws Exception {
            if (cs != null) cs.close();
            page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            cs = new PDPageContentStream(doc, page);
            y = PDRectangle.A4.getHeight() - MARGIN;
        }

        private void checkSpace(float needed) throws Exception {
            if (y - needed < MARGIN) newPage();
        }

        private void drawLine(float x1, float y1, float x2, float y2, Color color, float width) throws Exception {
            cs.setStrokingColor(color);
            cs.setLineWidth(width);
            cs.moveTo(x1, y1);
            cs.lineTo(x2, y2);
            cs.stroke();
        }

        private void fillRect(float x, float y, float w, float h, Color color) throws Exception {
            cs.setNonStrokingColor(color);
            cs.addRect(x, y, w, h);
            cs.fill();
            cs.setNonStrokingColor(Color.BLACK);
        }

        private void text(String txt, float x, float y, PDType1Font font, float size, Color color) throws Exception {
            cs.setNonStrokingColor(color);
            cs.beginText();
            cs.setFont(font, size);
            cs.newLineAtOffset(x, y);
            cs.showText(txt != null ? txt : "");
            cs.endText();
            cs.setNonStrokingColor(Color.BLACK);
        }

        private void textRight(String txt, float rightX, float y, PDType1Font font, float size, Color color) throws Exception {
            float w = font.getStringWidth(txt != null ? txt : "") / 1000 * size;
            text(txt, rightX - w, y, font, size, color);
        }

        void writeReport(LocalDate startDate, LocalDate endDate, BigDecimal openingBalance,
                         Map<LocalDate, List<Transaction>> byDate,
                         BigDecimal totalIncome, BigDecimal totalExpense, BigDecimal closingBalance) throws Exception {

            // Title
            text("MySpend – Expense Report", MARGIN, y, fontBold, 20, TEAL);
            y -= 10;
            drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, TEAL, 1.5f);
            y -= 18;

            // Date range
            String range = startDate.format(DATE_FMT) + "  to  " + endDate.format(DATE_FMT);
            text("Period: " + range, MARGIN, y, fontRegular, 11, Color.DARK_GRAY);
            y -= 24;

            // Opening balance
            fillRect(MARGIN, y - 6, CONTENT_WIDTH, 20, LIGHT_GRAY);
            text("Opening Balance", MARGIN + 4, y + 5, fontBold, 11, Color.DARK_GRAY);
            textRight("₹ " + fmt(openingBalance), PAGE_WIDTH - MARGIN - 4, y + 5, fontBold, 11, Color.DARK_GRAY);
            y -= 30;

            // Date-wise sections
            for (Map.Entry<LocalDate, List<Transaction>> entry : byDate.entrySet()) {
                LocalDate date = entry.getKey();
                List<Transaction> txns = entry.getValue();
                checkSpace(60);

                // Date header
                fillRect(MARGIN, y - 4, CONTENT_WIDTH, 18, new Color(220, 240, 240));
                text(date.format(DATE_FMT), MARGIN + 4, y + 5, fontBold, 10, TEAL);
                y -= 20;

                BigDecimal dayIncome = BigDecimal.ZERO;
                BigDecimal dayExpense = BigDecimal.ZERO;

                for (Transaction t : txns) {
                    checkSpace(18);
                    boolean isIncome = t.getType() == TransactionType.INCOME;
                    String label = isIncome
                            ? "  ↑ " + (t.getSource() != null ? t.getSource() : "Income")
                            : "  ↓ " + (t.getCategory() != null ? t.getCategory() : "Expense");
                    if (t.getDescription() != null && !t.getDescription().isBlank()) {
                        label += " – " + t.getDescription();
                    }
                    // Truncate long labels
                    if (label.length() > 60) label = label.substring(0, 57) + "...";

                    text(label, MARGIN, y, fontRegular, 10, Color.BLACK);
                    Color amtColor = isIncome ? new Color(0, 120, 0) : new Color(180, 0, 0);
                    textRight((isIncome ? "+ " : "- ") + "₹ " + fmt(t.getAmount()),
                            PAGE_WIDTH - MARGIN, y, fontBold, 10, amtColor);

                    if (isIncome) dayIncome = dayIncome.add(t.getAmount());
                    else dayExpense = dayExpense.add(t.getAmount());
                    y -= 16;
                }

                // Day subtotals
                checkSpace(20);
                drawLine(MARGIN + 8, y + 10, PAGE_WIDTH - MARGIN - 8, y + 10, Color.LIGHT_GRAY, 0.5f);
                y -= 2;
                text("Day: Income ₹ " + fmt(dayIncome) + "   Expense ₹ " + fmt(dayExpense),
                        MARGIN + 4, y, fontRegular, 9, Color.GRAY);
                y -= 20;
            }

            // Summary footer
            checkSpace(100);
            y -= 6;
            drawLine(MARGIN, y + 8, PAGE_WIDTH - MARGIN, y + 8, TEAL, 1f);
            y -= 4;

            text("Total Money Received", MARGIN + 4, y, fontRegular, 11, Color.BLACK);
            textRight("₹ " + fmt(totalIncome), PAGE_WIDTH - MARGIN - 4, y, fontBold, 11, new Color(0, 120, 0));
            y -= 18;

            text("Total Expenses", MARGIN + 4, y, fontRegular, 11, Color.BLACK);
            textRight("₹ " + fmt(totalExpense), PAGE_WIDTH - MARGIN - 4, y, fontBold, 11, new Color(180, 0, 0));
            y -= 22;

            drawLine(MARGIN, y + 8, PAGE_WIDTH - MARGIN, y + 8, Color.GRAY, 0.5f);
            y -= 4;

            fillRect(MARGIN, y - 6, CONTENT_WIDTH, 22, new Color(0, 128, 128));
            text("Closing Balance", MARGIN + 4, y + 5, fontBold, 12, Color.WHITE);
            textRight("₹ " + fmt(closingBalance), PAGE_WIDTH - MARGIN - 4, y + 5, fontBold, 12, Color.WHITE);
            y -= 36;

            cs.close();
            cs = null;
        }

        private String fmt(BigDecimal val) {
            return String.format("%,.2f", val);
        }
    }
}
