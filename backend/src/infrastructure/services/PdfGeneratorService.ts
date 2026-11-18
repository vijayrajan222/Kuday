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
          `Document Reference: KUDAY-AGR-${agreement.id.slice(-8).toUpperCase()}  |  Version: ${
            agreement.version || 1
          }`,
          { align: "center" }
        )
        .moveDown(0.2);

      if (agreement.lockedAt) {
        doc
          .fontSize(9)
          .fillColor(mutedColor)
          .text(
            `Executed and Sealed: ${new Date(agreement.lockedAt).toLocaleDateString("en-IN", {
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
        .fontSize(10)
        .fillColor(secondaryColor)
        .font("Helvetica")
        .text(
          `The Lessor hereby agrees to lease to the Lessee the residential room/unit described as: `
        )
        .font("Helvetica-Bold")
        .text(
          `${agreement.room?.title || agreement.room?.roomType || "Residential Room"} located at: ${
            agreement.room?.location || "Premises Address"
          }`
        )
        .moveDown(0.8);

      // Section: Agreed Terms
      doc.fontSize(12).fillColor(primaryColor).font("Helvetica-Bold").text("3. AGREED COMMON TERMS");
      doc.moveDown(0.4);

      const terms = agreement.commonTerms;
      const termsList = [
        `Monthly Rent: INR ${terms?.rent?.toLocaleString("en-IN") || "N/A"}`,
        `Security Deposit: INR ${terms?.deposit?.toLocaleString("en-IN") || "N/A"}`,
        `Move-in Date: ${terms?.moveInDate || "N/A"}`,
        `Tenancy Duration: ${terms?.durationMonths || 11} Month(s)`,
        `Notice Period: ${terms?.noticePeriodDays || 30} Day(s)`,
        `Payment Due Day: By the ${terms?.paymentDueDay || 5}th of each calendar month`,
        `Utility Inclusions & Sharing: ${terms?.utilities || "As mutually agreed"}`,
      ];

      doc.font("Helvetica").fontSize(10).fillColor(secondaryColor);
      termsList.forEach((term) => {
        doc.text(`  •  ${term}`, { indent: 10 });
      });
      doc.moveDown(0.8);

      // Section: Host Obligations
      doc.fontSize(12).fillColor(primaryColor).font("Helvetica-Bold").text("4. HOST OBLIGATIONS");
      doc.moveDown(0.4);

      doc.font("Helvetica").fontSize(9.5).fillColor(secondaryColor);
      (agreement.hostObligations || []).forEach((ob, idx) => {
        doc.text(`  4.${idx + 1}  ${ob}`, { indent: 10, align: "justify" });
        doc.moveDown(0.2);
      });
      doc.moveDown(0.6);

      // Section: Seeker Obligations
      doc.fontSize(12).fillColor(primaryColor).font("Helvetica-Bold").text("5. TENANT OBLIGATIONS");
      doc.moveDown(0.4);

      doc.font("Helvetica").fontSize(9.5).fillColor(secondaryColor);
      (agreement.seekerObligations || []).forEach((ob, idx) => {
        doc.text(`  5.${idx + 1}  ${ob}`, { indent: 10, align: "justify" });
        doc.moveDown(0.2);
      });
      doc.moveDown(0.6);

      // Section: Custom Clauses (Accepted only)
      const acceptedClauses = (agreement.customClauses || []).filter((c) => c.status === "accepted");
      if (acceptedClauses.length > 0) {
        doc.fontSize(12).fillColor(primaryColor).font("Helvetica-Bold").text("6. ADDITIONAL AGREED COVENANTS");
        doc.moveDown(0.4);

        doc.font("Helvetica").fontSize(9.5).fillColor(secondaryColor);
        acceptedClauses.forEach((c, idx) => {
          doc.text(`  6.${idx + 1} [Additional clause] ${c.finalText}`, {
            indent: 10,
            align: "justify",
          });
          doc.moveDown(0.2);
        });
        doc.moveDown(0.8);
      }

      // Check if space for Signatures, otherwise add page
      if (doc.y > 620) {
        doc.addPage();
      } else {
        doc.moveDown(0.8);
      }

      // Section: Signatures & Execution Audit Log
      doc.fontSize(12).fillColor(primaryColor).font("Helvetica-Bold").text("7. DIGITAL SIGNATURES & AUDIT LOG");
      doc.moveDown(0.4);

      doc
        .fontSize(9)
        .fillColor(mutedColor)
        .font("Helvetica")
        .text(
          "Both parties have electronically affirmed, verified, and executed this residential agreement document via authenticated electronic assent:"
        )
        .moveDown(0.6);

      const hostSig = agreement.signatures?.host;
      const seekerSig = agreement.signatures?.seeker;

      // Signature Box Left (Host)
      const sigBoxY = doc.y;
      doc
        .rect(50, sigBoxY, 230, 75)
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
        .text(`Signed by: ${hostName}`, 60, sigBoxY + 26)
        .text(
          `Signed at: ${
            hostSig?.signedAt
              ? new Date(hostSig.signedAt).toLocaleString("en-IN")
              : "Pending execution"
          }`,
          60,
          sigBoxY + 40
        )
        .text(`Audit IP: ${hostSig?.ip || "Recorded on sign"}`, 60, sigBoxY + 54);

      // Signature Box Right (Seeker)
      doc
        .rect(305, sigBoxY, 240, 75)
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
        .text(`Signed by: ${seekerName}`, 315, sigBoxY + 26)
        .text(
          `Signed at: ${
            seekerSig?.signedAt
              ? new Date(seekerSig.signedAt).toLocaleString("en-IN")
              : "Pending execution"
          }`,
          315,
          sigBoxY + 40
        )
        .text(`Audit IP: ${seekerSig?.ip || "Recorded on sign"}`, 315, sigBoxY + 54);

      // Footer Legal Disclaimer
      doc.moveDown(6);
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
