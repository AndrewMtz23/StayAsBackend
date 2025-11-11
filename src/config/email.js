import nodemailer from "nodemailer";

// Configuración del transportador de email
export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// ========================================
// EMAIL DE VERIFICACIÓN (YA EXISTE)
// ========================================

export async function sendVerificationEmail(email, name, code) {
  const mailOptions = {
    from: `"Arroyo Seco" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔑 Código de verificación - Arroyo Seco",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1E2353; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px dashed #1E2353; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .code { font-size: 32px; font-weight: bold; color: #1E2353; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏡 Bienvenido a Arroyo Seco</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${name}!</h2>
            <p>Gracias por registrarte en el Portal de Ayuntamiento de Arroyo Seco.</p>
            <p>Para completar tu registro, por favor usa el siguiente código de verificación:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <p><strong>Este código expira en 15 minutos.</strong></p>
            <p>Si no solicitaste este registro, puedes ignorar este correo.</p>
          </div>
          <div class="footer">
            <p>Ayuntamiento 2024-2027 | © 2025 Arroyo Seco, Querétaro</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error al enviar email:", error);
    throw new Error("Error al enviar el correo de verificación");
  }
}

// ========================================
// EMAIL DE RECUPERACIÓN DE CONTRASEÑA (YA EXISTE)
// ========================================

export async function sendPasswordResetEmail(email, name, resetLink) {
  const mailOptions = {
    from: `"Arroyo Seco" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔒 Recuperación de Contraseña - Arroyo Seco",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1E2353; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #1E2353; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #2B7A8B; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔓 Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${name}!</h2>
            <p>Recibimos una solicitud para restablecer tu contraseña en Arroyo Seco.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Restablecer Contraseña</a>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ Importante:</strong></p>
              <ul>
                <li>Este enlace expira en <strong>1 hora</strong></li>
                <li>Si no solicitaste este cambio, ignora este correo</li>
                <li>Nunca compartas este enlace con nadie</li>
              </ul>
            </div>
            
            <p><small>Si el botón no funciona, copia y pega este enlace en tu navegador:</small></p>
            <p><small style="word-break: break-all; color: #666;">${resetLink}</small></p>
          </div>
          <div class="footer">
            <p>Ayuntamiento 2024-2027 | © 2025 Arroyo Seco, Querétaro</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de recuperación enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("Error al enviar email:", error);
    throw new Error("Error al enviar el correo de recuperación");
  }
}

// ========================================
// ✅ NUEVAS FUNCIONES PARA SOLICITUDES DE HOST
// ========================================

/**
 * Notificar a admins/empleados sobre nueva solicitud de Host
 */
export async function sendHostRequestNotification(userName, userEmail, message) {
  const adminEmail = process.env.EMAIL_USER; // O puedes tener un EMAIL_ADMIN específico
  
  const mailOptions = {
    from: `"Arroyo Seco" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: "🏡 Nueva Solicitud para ser Host - Arroyo Seco",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2B7A8B; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; border-left: 4px solid #2B7A8B; padding: 15px; margin: 15px 0; }
          .message-box { background: white; border: 1px solid #ddd; padding: 20px; margin: 15px 0; border-radius: 8px; }
          .button { display: inline-block; background: #2B7A8B; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 Nueva Solicitud de Host</h1>
          </div>
          <div class="content">
            <p>Se ha recibido una nueva solicitud para convertirse en Host:</p>
            
            <div class="info-box">
              <p><strong>👤 Usuario:</strong> ${userName}</p>
              <p><strong>📧 Email:</strong> ${userEmail}</p>
              <p><strong>📅 Fecha:</strong> ${new Date().toLocaleString('es-MX')}</p>
            </div>
            
            <p><strong>Mensaje del usuario:</strong></p>
            <div class="message-box">
              <p>${message}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/admin/host-requests" class="button">Ver en el Panel de Administración</a>
            </div>
            
            <p><small>Accede al panel para revisar la solicitud y enviar el formulario de aplicación.</small></p>
          </div>
          <div class="footer">
            <p>Ayuntamiento 2024-2027 | © 2025 Arroyo Seco, Querétaro</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Notificación de solicitud enviada a admins`);
    return true;
  } catch (error) {
    console.error("Error al enviar notificación:", error);
    throw new Error("Error al enviar notificación a administradores");
  }
}

/**
 * Enviar formulario de aplicación al cliente
 */
export async function sendHostApplicationForm(email, name, formLink) {
  const mailOptions = {
    from: `"Arroyo Seco" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "📝 Completa tu Solicitud para ser Host - Arroyo Seco",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2B7A8B; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #2B7A8B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .checklist { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
          .checklist li { margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Buenas Noticias!</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${name}!</h2>
            <p>Hemos revisado tu solicitud inicial para convertirte en Host y nos gustaría continuar con el proceso.</p>
            <p>Para avanzar, necesitamos que completes el siguiente formulario con información adicional:</p>
            
            <div style="text-align: center;">
              <a href="${formLink}" class="button">Completar Formulario de Aplicación</a>
            </div>
            
            <div class="checklist">
              <p><strong>📋 Información que necesitaremos:</strong></p>
              <ul>
                <li>✅ Tu motivación para ser Host</li>
                <li>✅ Experiencia previa (si aplica)</li>
                <li>✅ Datos de contacto adicionales</li>
                <li>✅ Información sobre tu propiedad o servicio</li>
                <li>✅ Documentación requerida</li>
              </ul>
            </div>
            
            <p><strong>⏰ Importante:</strong> Por favor completa el formulario lo antes posible para agilizar tu proceso de aprobación.</p>
            
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            
            <p><small>Si el botón no funciona, copia y pega este enlace:</small></p>
            <p><small style="word-break: break-all; color: #666;">${formLink}</small></p>
          </div>
          <div class="footer">
            <p>Ayuntamiento 2024-2027 | © 2025 Arroyo Seco, Querétaro</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Formulario enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("Error al enviar formulario:", error);
    throw new Error("Error al enviar el formulario");
  }
}

/**
 * Notificar aprobación de solicitud
 */
export async function sendHostRequestApproved(email, name) {
  const mailOptions = {
    from: `"Arroyo Seco" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🎊 ¡Felicidades! Tu solicitud fue aprobada - Arroyo Seco",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d4edda; border: 2px solid #28a745; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .next-steps { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Bienvenido como Host!</h1>
          </div>
          <div class="content">
            <h2>¡Felicidades ${name}!</h2>
            
            <div class="success-box">
              <h3 style="color: #28a745; margin: 0;">✅ Tu solicitud ha sido aprobada</h3>
              <p style="margin: 10px 0 0 0;">Ahora eres oficialmente un Host de Arroyo Seco</p>
            </div>
            
            <p>Nos complace informarte que tu solicitud para convertirte en Host ha sido aprobada exitosamente.</p>
            
            <div class="next-steps">
              <p><strong>📌 Próximos pasos:</strong></p>
              <ol>
                <li>Inicia sesión en tu cuenta</li>
                <li>Completa tu perfil de Host</li>
                <li>Publica tu primera propiedad o experiencia</li>
                <li>Comienza a recibir reservaciones</li>
              </ol>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" class="button">Acceder a mi Cuenta</a>
            </div>
            
            <p>Estamos emocionados de tenerte en nuestra comunidad de Hosts. Si tienes alguna pregunta, nuestro equipo está aquí para ayudarte.</p>
          </div>
          <div class="footer">
            <p>Ayuntamiento 2024-2027 | © 2025 Arroyo Seco, Querétaro</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de aprobación enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("Error al enviar email de aprobación:", error);
    throw new Error("Error al enviar notificación de aprobación");
  }
}

/**
 * Notificar rechazo de solicitud
 */
export async function sendHostRequestRejected(email, name, reason) {
  const mailOptions = {
    from: `"Arroyo Seco" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "📋 Actualización sobre tu Solicitud de Host - Arroyo Seco",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reason-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Actualización de Solicitud</h1>
          </div>
          <div class="content">
            <h2>Hola ${name},</h2>
            <p>Gracias por tu interés en convertirte en Host de Arroyo Seco.</p>
            <p>Después de revisar cuidadosamente tu solicitud, lamentamos informarte que en este momento no podemos aprobarla.</p>
            
            <div class="reason-box">
              <p><strong>📝 Motivo:</strong></p>
              <p>${reason}</p>
            </div>
            
            <div class="info-box">
              <p><strong>💡 ¿Qué puedes hacer?</strong></p>
              <ul>
                <li>Puedes aplicar nuevamente en el futuro</li>
                <li>Si tienes preguntas, contáctanos</li>
                <li>Revisa los requisitos y considera mejorar tu aplicación</li>
              </ul>
            </div>
            
            <p>Valoramos tu interés y esperamos poder trabajar contigo en el futuro.</p>
          </div>
          <div class="footer">
            <p>Ayuntamiento 2024-2027 | © 2025 Arroyo Seco, Querétaro</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de rechazo enviado a: ${email}`);
    return true;
  } catch (error) {
    console.error("Error al enviar email de rechazo:", error);
    throw new Error("Error al enviar notificación de rechazo");
  }
}