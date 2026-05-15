const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Employee = require('../models/employee');
const ConfigReporte = require('../models/configReporte');
const NotificacionLog = require('../models/notificacionLog');
const { Op } = require('sequelize');

const start = () => {
    // Programar para ejecutarse todos los días a las 8:30 AM
    cron.schedule('30 8 * * *', async () => {
        console.log('⏰ Cron ejecutado: Revisando aniversarios...');
        await checkAnniversaries();
    });
};

/**
 * Busca empleados cuyo aniversario laboral cae dentro de los próximos 30 días,
 * verifica que no se haya notificado ya este año, y envía correos.
 */
const checkAnniversaries = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentYear = today.getFullYear();

        const employees = await Employee.findAll({
            where: { estado: true }
        });

        // Filtrar empleados cuyo aniversario está dentro de los próximos 30 días
        const anniversaryEmployees = employees.filter(emp => {
            if (!emp.fecha_ingreso) return false;
            const ingreso = new Date(emp.fecha_ingreso);

            // No contar empleados que ingresaron este mismo año (no tienen aniversario aún)
            if (ingreso.getFullYear() === today.getFullYear() && ingreso >= today) return false;

            // Calcular el aniversario de este año
            const thisYearAnniversary = new Date(today.getFullYear(), ingreso.getMonth(), ingreso.getDate());

            // Si ya pasó este año, mirar el del próximo año
            if (thisYearAnniversary < today) {
                thisYearAnniversary.setFullYear(today.getFullYear() + 1);
            }

            const diffTime = thisYearAnniversary - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Notificar si el aniversario es en los próximos 30 días
            return diffDays >= 0 && diffDays <= 30;
        });

        console.log(`📋 Empleados con aniversario próximo (30 días): ${anniversaryEmployees.length}`);

        if (anniversaryEmployees.length === 0) {
            console.log('✅ No hay aniversarios próximos.');
            return;
        }

        // ====== VERIFICAR CUÁLES YA FUERON NOTIFICADOS ======
        const employeeIds = anniversaryEmployees.map(e => e.id);
        const alreadySent = await NotificacionLog.findAll({
            where: {
                tipo: 'aniversario',
                employee_id: { [Op.in]: employeeIds },
                anio: currentYear,
                estado: 'enviado'
            }
        });

        const sentIds = new Set(alreadySent.map(n => n.employee_id));
        const pendingEmployees = anniversaryEmployees.filter(emp => !sentIds.has(emp.id));

        if (pendingEmployees.length === 0) {
            console.log('✅ Todos los aniversarios ya fueron notificados este año.');
            return;
        }

        console.log(`📨 Empleados pendientes de notificar: ${pendingEmployees.length} (${sentIds.size} ya notificados)`);

        // Agrupar empleados por empresa
        const groupedByCompany = pendingEmployees.reduce((acc, emp) => {
            if (!acc[emp.empresa]) acc[emp.empresa] = [];
            acc[emp.empresa].push(emp);
            return acc;
        }, {});

        // Obtener reglas de reporte activas
        const rules = await ConfigReporte.findAll({ where: { activo: true } });

        if (rules.length === 0) {
            console.log('⚠️ No hay reglas de reporte configuradas.');
            return;
        }

        for (const rule of rules) {
            const companiesInRule = JSON.parse(rule.empresas);
            const recipients = [process.env.ADMIN_EMAIL];

            // Añadir correos extra de la regla
            if (rule.emails) {
                const extraEmails = rule.emails
                    .split(/[,;]/)
                    .map(email => email.trim())
                    .filter(email => email && email.includes('@'));
                recipients.push(...extraEmails);
            }

            const uniqueRecipients = [...new Set(recipients.filter(r => !!r))];

            // Consolidar empleados para todas las empresas de esta regla
            let employeesToNotify = [];
            for (const companyName of companiesInRule) {
                if (groupedByCompany[companyName]) {
                    employeesToNotify.push(...groupedByCompany[companyName]);
                }
            }

            if (employeesToNotify.length > 0 && uniqueRecipients.length > 0) {
                const companyLabels = companiesInRule.join(', ');
                console.log(`📧 Enviando correo para ${companyLabels} a: ${uniqueRecipients.join(', ')}`);
                
                const success = await sendAnniversaryEmail(uniqueRecipients.join(', '), employeesToNotify, companyLabels);

                // ====== REGISTRAR RESULTADO EN LOG ======
                for (const emp of employeesToNotify) {
                    try {
                        await NotificacionLog.upsert({
                            tipo: 'aniversario',
                            employee_id: emp.id,
                            anio: currentYear,
                            destinatarios: uniqueRecipients.join(', '),
                            estado: success ? 'enviado' : 'fallido',
                            error_msg: success ? null : 'Error al enviar email'
                        });
                    } catch (logError) {
                        console.error(`⚠️ Error guardando log para empleado ${emp.id}:`, logError.message);
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Error in checkAnniversaries:', error);
    }
};

const sendAnniversaryEmail = async (toEmail, employees, companyName) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const today = new Date();

    const employeeRows = employees.map(e => {
        const ingreso = new Date(e.fecha_ingreso);
        const años = today.getFullYear() - ingreso.getFullYear();
        const aniversario = new Date(today.getFullYear(), ingreso.getMonth(), ingreso.getDate());
        if (aniversario < today) aniversario.setFullYear(today.getFullYear() + 1);
        const diasRestantes = Math.ceil((aniversario - today) / (1000 * 60 * 60 * 24));

        return `
            <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eef2f7;">${e.nombre_completo}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eef2f7;">${e.cargo || '-'}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eef2f7;">${new Date(e.fecha_ingreso).toLocaleDateString('es-CO')}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eef2f7; font-weight: 600; color: #4f46e5;">${años} ${años === 1 ? 'año' : 'años'}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #eef2f7;">
                    <span style="background: ${diasRestantes <= 7 ? '#fef2f2' : '#f0fdf4'}; color: ${diasRestantes <= 7 ? '#dc2626' : '#16a34a'}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                        ${diasRestantes === 0 ? '¡Hoy!' : `En ${diasRestantes} días`}
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    const mailOptions = {
        from: `"Gestión Humana" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `🎉 Aniversarios Laborales Próximos - ${companyName}`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px;">🎂 Próximos Aniversarios Laborales</h1>
                    <p style="color: #e0e7ff; margin: 8px 0 0; font-size: 14px;">${companyName} — Reporte generado el ${today.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                
                <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                    <p style="color: #6b7280; margin: 0 0 20px;">Los siguientes empleados cumplen aniversario laboral en los próximos <strong>30 días</strong>:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr style="background: #f8fafc;">
                                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Empleado</th>
                                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Cargo</th>
                                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Ingreso</th>
                                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Cumple</th>
                                <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Faltan</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${employeeRows}
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;">
                        <p style="margin: 0; color: #166534; font-size: 13px;">💡 <strong>Recordatorio:</strong> Planifica con anticipación cualquier reconocimiento o celebración para estos colaboradores.</p>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                    <p style="font-size: 11px; color: #9ca3af; margin: 0;">Sistema de Gestión de Talento Humano — Gestión Humana</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email de aniversario enviado para ${companyName} a ${toEmail}`);
        return true;
    } catch (error) {
        console.error(`❌ Error enviando email para ${companyName}:`, error.message);
        return false;
    }
};

module.exports = {
    start,
    checkAnniversaries
};
