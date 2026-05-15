const { response } = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');

const login = async (req, res = response) => {
    const { username, password } = req.body;

    try {
        // Verificar si el usuario existe
        const user = await User.findOne({ where: { username, estado: true } });
        if (!user) {
            return res.status(400).json({ msg: 'Usuario / Password no son correctos - username' });
        }

        // Verificar la contraseña
        const validPassword = bcryptjs.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ msg: 'Usuario / Password no son correctos - password' });
        }

        // Generar el JWT
        const token = jwt.sign({ uid: user.id, role: user.role }, process.env.SECRETORPRIVATEKEY || 'V3Pr0d_S3cr3t_K3y', {
            expiresIn: '4h'
        });

        res.json({
            user: {
                username: user.username,
                email: user.email,
                role: user.role
            },
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Hable con el administrador' });
    }
};

const forgotPassword = async (req, res = response) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ where: { email, estado: true } });
        if (!user) {
            return res.status(400).json({ msg: 'No existe un usuario con ese correo' });
        }

        // Generar token de recuperación
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpire = Date.now() + 3600000; // 1 hora

        await user.update({ resetToken, resetTokenExpire });

        // Configurar Nodemailer (usa las mismas credenciales del sistema)
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const mailOptions = {
            from: `"Gestión Humana" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: '🔐 Recuperación de Contraseña - Gestión Humana',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 20px;">🔐 Recuperar Contraseña</h1>
                    </div>
                    <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                        <p style="color: #374151;">Hola <strong>${user.username}</strong>,</p>
                        <p style="color: #6b7280;">Has solicitado restablecer tu contraseña. Haz clic en el botón para continuar:</p>
                        <div style="text-align: center; margin: 24px 0;">
                            <a href="${resetUrl}" style="background: #4f46e5; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
                        </div>
                        <p style="color: #9ca3af; font-size: 12px;">Este enlace expirará en 1 hora. Si no solicitaste esto, ignora este correo.</p>
                        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        <p style="font-size: 11px; color: #9ca3af;">Sistema de Gestión — Gestión Humana</p>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.json({ msg: 'Se ha enviado un correo de recuperación' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al enviar el correo' });
    }
};

const resetPassword = async (req, res = response) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const user = await User.findOne({ 
            where: { 
                resetToken: token,
                resetTokenExpire: { [require('sequelize').Op.gt]: Date.now() }
            } 
        });

        if (!user) {
            return res.status(400).json({ msg: 'Token inválido o expirado' });
        }

        // Encriptar la nueva contraseña
        const salt = bcryptjs.genSaltSync();
        user.password = bcryptjs.hashSync(password, salt);
        user.resetToken = null;
        user.resetTokenExpire = null;

        await user.save();

        res.json({ msg: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Hable con el administrador' });
    }
};

// Temporal: Crear el primer admin si no existe
const seedAdmin = async (req, res) => {
    try {
        const adminExists = await User.findOne({ where: { role: 'ADMIN_ROLE' } });
        if (adminExists) return res.status(400).json({ msg: 'Admin ya existe' });

        const salt = bcryptjs.genSaltSync();
        const password = bcryptjs.hashSync('admin123', salt);

        const admin = await User.create({
            username: 'admin',
            email: 'admin@veprodutions.com',
            password,
            role: 'ADMIN_ROLE'
        });

        res.json({ msg: 'Admin creado', admin: { username: admin.username } });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

const changePassword = async (req, res = response) => {
    const { oldPassword, newPassword } = req.body;
    const { id } = req.user; // Obtenido del middleware validarJWT

    try {
        const user = await User.findByPk(id);
        
        // Validar contraseña actual
        const validPassword = bcryptjs.compareSync(oldPassword, user.password);
        if (!validPassword) {
            return res.status(400).json({ msg: 'La contraseña actual es incorrecta' });
        }

        // Encriptar nueva contraseña
        const salt = bcryptjs.genSaltSync();
        user.password = bcryptjs.hashSync(newPassword, salt);
        await user.save();

        res.json({ msg: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Hable con el administrador' });
    }
};

module.exports = {
    login,
    forgotPassword,
    resetPassword,
    seedAdmin,
    changePassword
};
