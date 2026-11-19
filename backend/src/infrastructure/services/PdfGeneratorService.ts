import PDFDocument from "pdfkit";
import type { IPdfGeneratorService } from "@application/interfaces/services/IPdfGeneratorService";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";

export class PdfGeneratorService implements IPdfGeneratorService {
  async generateAgreementPdf(agreement: AgreementResponseDto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        info: {
          Title: `Rental Agreement - ${agreement.id}`,
          Author: "Kuday Room Rentals",
          Subject: "Residential Tenancy Agreement",
        },
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: Error) => reject(err));

      const hostName =
        `${agreement.host?.firstName || ""} ${agreement.host?.lastName || ""}`.trim() ||
        "Host (Lessor)";
      const seekerName =
        `${agreement.seeker?.firstName || ""} ${agreement.seeker?.lastName || ""}`.trim() ||
        "Tenant (Lessee)";

      // Primary Accent Colors
      const primaryColor = "#0f172a";
      const secondaryColor = "#334155";
      const mutedColor = "#64748b";

      // Header
      doc
        .fontSize(20)
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .text("RESIDENTIAL RENTAL AGREEMENT", { align: "center" })
        .moveDown(0.3);

      doc
        .fontSize(10)
        .fillColor(mutedColor)
        .font("Helvetica")
        .text(
          `Document Reference: KUDAY-AGR-${agreement.id.slice(-8).toUpperCase()}  |  Revision: ${
            agreement.revision || 1
          }`,
          { align: "center" }
        )
        .moveDown(0.2);

      if (agreement.lockedAt) {
        doc
          .fontSize(9)
          .fillColor(mutedColor)
          .text(
            `Executed and Finalized: ${new Date(agreement.lockedAt).toLocaleDateString("en-IN", {
              dateStyle: "full",
            })}`,
            { align: "center" }
          )
          .moveDown(0.8);
      } else {
        doc.moveDown(0.8);
      }

      // Divider Line
      doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(1);

      // Section: The Parties
      doc.fontSize(12).fillColor(primaryColor).font("Helvetica-Bold").text("1. THE PARTIES");
      doc.moveDown(0.4);

      doc
        .fontSize(10)
        .fillColor(secondaryColor)
        .font("Helvetica")
        .text(`This Agreement is entered into by and between:`)
        .moveDown(0.3);

      doc
        .font("Helvetica-Bold")
        .text(`LESSOR (HOST): `, { continued: true })
        .font("Helvetica")
        .text(`${hostName} (Email: ${agreement.host?.email || "N/A"})`)
        .moveDown(0.2);

      doc
        .font("Helvetica-Bold")
        .text(`LESSEE (TENANT): `, { continued: true })
        .font("Helvetica")
        .text(`${seekerName} (Email: ${agreement.seeker?.email || "N/A"})`)
        .moveDown(0.8);

      // Section: The Premises
      doc.fontSize(12).fillColor(primaryColor).font("Helvetica-Bold").text("2. THE PREMISES");
      doc.moveDown(0.4);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(secondaryColor)
        .text(
          `Premises: ${agreement.room?.title || agreement.room?.roomType || "Residential Room"}\nLocation: ${
            agreement.room?.location || "Premises Address"
          }`
        )
        .moveDown(0.8);

      // Section: Common Terms
      doc.fontSize(12).fillColor(primaryColor).font("Helvetica-Bold").text("3. COMMON TERMS & SCHEDULE");
      doc.moveDown(0.4);

      const terms = agreement.commonTerms;
      const termItems = [
        `Monthly Rent: Rs. ${terms.rent.toLocaleString("en-IN")} per month`,
        `Security Deposit: Rs. ${terms.deposit.toLocaleString("en-IN")} (refundable)`,
        `Move-in Date: ${terms.moveInDate}`,
        `Tenancy Duration: ${terms.durationMonths} months`,
        `Notice Period: ${terms.noticePeriodDays} days written notice required`,
        `Rent Due Date: Due on or before the ${terms.paymentDueDay}th of each calendar month`,
        `Utilities: ${terms.utilities}`,
      ];

      doc.fontSize(10).fillColor(secondaryColor).font("Helvetica");
      for (const item of termItems) {
        doc.text(`\u2022  ${item}`, { indent: 15 });
        doc.moveDown(0.15);
      }
      doc.moveDown(0.8);

      // Section: Host Obligations
      doc.fontSize(12).fillColor(primaryColor).font("Helvetica-Bold").text("4. LESSOR (HOST) OBLIGATIONS");
      doc.moveDown(0.4);

      doc.fontSize(10).fillColor(secondaryColor).font("Helvetica");
      for (const ob of agreement.hostObligations || []) {
        doc.text(`\u2022  ${ob}`, { indent: 15 });
        doc.moveDown(0.15);
      }
      doc.moveDown(0.8);

      // Section: Seeker Obligations
      doc.fontSize(12).fillColor(primaryColor).font("Helvetica-Bold").text("5. LESSEE (TENANT) OBLIGATIONS");
      doc.moveDown(0.4);

      doc.fontSize(10).fillColor(secondaryColor).font("Helvetica");
      for (const ob of agreement.seekerObligations || []) {
        doc.text(`\u2022  ${ob}`, { indent: 15 });
        doc.moveDown(0.15);
      }
      doc.moveDown(0.8);

      // Section: Custom Clauses (if any)
      const acceptedClauses = (agreement.customClauses || []).filter((c) => c.status === "accepted");
      if (acceptedClauses.length > 0) {
        doc.fontSize(12).fillColor(primaryColor).font("Helvetica-Bold").text("6. ADDITIONAL CUSTOM COVENANTS");
        doc.moveDown(0.4);

        doc.fontSize(10).fillColor(secondaryColor).font("Helvetica");
        acceptedClauses.forEach((clause, index) => {
          doc.text(`6.${index + 1}  ${clause.finalText}`, { indent: 15 });
          doc.moveDown(0.2);
        });
        doc.moveDown(0.8);
      }

      // Check if space remaining on page, otherwise add page for acceptance section
      if (doc.y > 640) {
        doc.addPage();
      }

      // Section: Acceptance and Execution Record
      doc.fontSize(12).fillColor(primaryColor).font("Helvetica-Bold").text("CONFIRMATION & ACCEPTANCE RECORD");
      doc.moveDown(0.4);

      const hostTimestamp = agreement.acceptanceTimestamps?.host
        ? new Date(agreement.acceptanceTimestamps.host).toLocaleString("en-IN")
        : agreement.lockedAt
        ? new Date(agreement.lockedAt).toLocaleString("en-IN")
        : "Confirmed upon proposal submission";

      const seekerTimestamp = agreement.acceptanceTimestamps?.seeker
        ? new Date(agreement.acceptanceTimestamps.seeker).toLocaleString("en-IN")
        : agreement.lockedAt
        ? new Date(agreement.lockedAt).toLocaleString("en-IN")
        : "Confirmed upon proposal acceptance";

      const sigBoxY = doc.y;
      // Host Box Left
      doc
        .rect(50, sigBoxY, 230, 65)
        .lineWidth(0.8)
        .strokeColor("#e2e8f0")
        .fillAndStroke("#f8fafc", "#cbd5e1");

      doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`HOST (LESSOR)`, 60, sigBoxY + 10);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(secondaryColor)
        .text(`Accepted by: ${hostName}`, 60, sigBoxY + 26)
        .text(`Timestamp: ${hostTimestamp}`, 60, sigBoxY + 40);

      // Seeker Box Right
      doc
        .rect(305, sigBoxY, 240, 65)
        .lineWidth(0.8)
        .strokeColor("#e2e8f0")
        .fillAndStroke("#f8fafc", "#cbd5e1");

      doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`TENANT (LESSEE)`, 315, sigBoxY + 10);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(secondaryColor)
        .text(`Accepted by: ${seekerName}`, 315, sigBoxY + 26)
        .text(`Timestamp: ${seekerTimestamp}`, 315, sigBoxY + 40);

      // Footer Legal Disclaimer
      doc.moveDown(5);
      doc
        .strokeColor("#e2e8f0")
        .lineWidth(0.8)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke()
        .moveDown(0.6);

      doc
        .fontSize(8)
        .fillColor(mutedColor)
        .font("Helvetica-Oblique")
        .text(
          "Disclaimer: This agreement is a record between the two parties and is not a registered or stamped legal document unless executed on stamp paper as required by law.",
          { align: "center" }
        );

      doc.end();
    });
  }
}
