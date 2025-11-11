import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 📄 Generar PDF elegante y alineado profesionalmente
 */
export function generatePaymentPDF(payment, reservation, type) {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfDir = path.join(process.cwd(), "uploads", "pdfs");
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

      const fileName = `comprobante-${payment.folio || payment.id}.pdf`;
      const filePath = path.join(pdfDir, fileName);
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const logoPath = path.join(__dirname, "../assets/logo.png");

      // ===============================
      // ENCABEZADO MEJORADO
      // ===============================
      doc.rect(0, 0, doc.page.width, 120).fill("#1E2353");

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 30, { width: 65 });
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(26)
        .fillColor("#FFFFFF")
        .text("COMPROBANTE DE PAGO", 130, 38);

      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#B8C5D6")
        .text("Arroyo Seco - Querétaro", 130, 68);

      // Línea decorativa bajo el header
      doc.moveTo(50, 135).lineTo(545, 135).strokeColor("#E5E7EB").lineWidth(1).stroke();

      // ===============================
      // HELPER FUNCTIONS
      // ===============================
      const sectionTitle = (title, yPos) => {
        const currentY = yPos || doc.y;
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor("#1E2353")
          .text(title.toUpperCase(), 50, currentY);
        
        doc.moveDown(0.8);
      };

      const infoLine = (label, value, indent = 50) => {
        const yPos = doc.y;
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#6B7280")
          .text(`${label}:`, indent, yPos, { width: 150, continued: false });
        
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor("#111827")
          .text(value || "N/A", indent + 155, yPos, { width: 320 });
        
        doc.moveDown(0.6);
      };

      // ===============================
      // DATOS DEL PAGO
      // ===============================
      doc.y = 160;
      sectionTitle("Datos del Pago");
      
      const paymentDate = new Date(payment.paymentDate).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      
      infoLine("Folio", payment.folio || payment.id);
      infoLine("Fecha de Pago", paymentDate);
      infoLine("Método de Pago", payment.method?.toUpperCase());
      infoLine("Estado", payment.status?.toUpperCase());

      // ===============================
      // DATOS DEL CLIENTE
      // ===============================
      doc.moveDown(1);
      sectionTitle("Datos del Cliente");
      infoLine("Nombre", reservation.user?.name);
      infoLine("Email", reservation.user?.email);

      // ===============================
      // DETALLES DE LA RESERVACIÓN
      // ===============================
      doc.moveDown(1);
      sectionTitle("Detalles de la Reservación");

      if (type === "activity") {
        infoLine("Tipo", "Experiencia");
        infoLine("Experiencia", reservation.activity?.title);
        infoLine("Ubicación", `${reservation.activity?.city}, ${reservation.activity?.state}`);
        infoLine(
          "Fecha",
          new Date(reservation.reservationDate).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        );
        infoLine("Personas", reservation.numberOfPeople);
        infoLine("Precio por persona", `$${reservation.activity?.price} MXN`);
      } else {
        infoLine("Tipo", "Hospedaje");
        infoLine("Propiedad", reservation.property?.title);
        infoLine("Ubicación", `${reservation.property?.city}, ${reservation.property?.state}`);
        infoLine(
          "Check-in",
          new Date(reservation.checkIn).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        );
        infoLine(
          "Check-out",
          new Date(reservation.checkOut).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        );
        infoLine("Huéspedes", reservation.guests);
        infoLine("Precio por noche", `$${reservation.property?.price} MXN`);
      }

      // ===============================
      // CAJA DE TOTAL PAGADO - MEJORADA
      // ===============================
      doc.moveDown(2);
      const boxY = doc.y;
      
      // Sombra sutil
      doc
        .roundedRect(52, boxY + 2, 493, 75, 8)
        .fillOpacity(0.08)
        .fill("#000000")
        .fillOpacity(1);
      
      // Caja principal
      doc
        .roundedRect(50, boxY, 493, 75, 8)
        .lineWidth(2)
        .fillAndStroke("#F8FAFC", "#1E2353");

      // Label "TOTAL PAGADO"
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#6B7280")
        .text("TOTAL PAGADO", 70, boxY + 22, { width: 200 });

      // Monto
      doc
        .font("Helvetica-Bold")
        .fontSize(28)
        .fillColor("#1E2353")
        .text(`$${Number(payment.amount).toFixed(2)} MXN`, 70, boxY + 40, { 
          width: 453, 
          align: "right" 
        });

      // ===============================
      // SELLO "PAGADO" MEJORADO
      // ===============================
      if (payment.status?.toUpperCase() === "APPROVED") {
        doc.save();
        doc
          .font("Helvetica-Bold")
          .fontSize(65)
          .fillColor("#1E2353")
          .opacity(0.06)
          .translate(300, boxY + 130)
          .rotate(-30, { origin: [0, 0] })
          .text("PAGADO", -100, -15, { width: 200, align: "center" });
        doc.restore();
      }

      // ===============================
      // QR CODE
      // ===============================
      const qrText = `https://stayas.mx/recibos/${payment.folio || payment.id}`;
      const qrPath = path.join(pdfDir, `qr-${payment.id}.png`);
      await QRCode.toFile(qrPath, qrText, { width: 120 });

      const qrY = boxY + 110;
      doc.image(qrPath, 253, qrY, { width: 90 });
      
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#6B7280")
        .text("Escanea para verificar autenticidad", 50, qrY + 95, {
          align: "center",
          width: 493,
        });

      // ===============================
      // FOOTER MEJORADO
      // ===============================
      const footerY = doc.page.height - 80;
      
      doc
        .font("Helvetica-Oblique")
        .fontSize(9)
        .fillColor("#9CA3AF")
        .text(
          "Documento generado automáticamente — no requiere firma.", 
          50, 
          footerY, 
          { align: "center", width: 493 }
        );

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#D1D5DB")
        .text(
          "Arroyo Seco, Querétaro | contacto@arroyoseco.gob.mx", 
          50, 
          footerY + 18, 
          { align: "center", width: 493 }
        );

      // Finalizar
      doc.end();
      stream.on("finish", () => resolve(filePath));
      stream.on("error", (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
}