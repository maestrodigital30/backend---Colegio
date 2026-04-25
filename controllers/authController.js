const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail } = require('../models/authModel');
const { registrarAuditoria } = require('../models/auditoriaModel');

const login = async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  try {
    const usuario = await findUserByEmail(correo);

    if (!usuario) {
      return res.status(404).json({ error: 'Correo no registrado o usuario inactivo' });
    }

    const coincide = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!coincide) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        correo: usuario.correo,
        id_rol: usuario.id_rol,
        rol: usuario.rol,
        id_perfil_docente: usuario.id_perfil_docente || null,
        id_alumno: usuario.id_alumno || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    await registrarAuditoria({
      id_usuario: usuario.id,
      nombre_entidad: 'tbl_usuarios',
      id_entidad: usuario.id,
      tipo_accion: 'login',
      datos_nuevos: { correo: usuario.correo, rol: usuario.rol },
    });

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos || '',
        correo: usuario.correo,
        id_rol: usuario.id_rol,
        rol: usuario.rol,
        id_perfil_docente: usuario.id_perfil_docente || null,
        id_alumno: usuario.id_alumno || null,
        nombre_completo: `${usuario.nombres} ${usuario.apellidos || ''}`.trim(),
        permisos: usuario.permisos,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

module.exports = { login };
