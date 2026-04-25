const pool = require('../config/db');

const findUserByEmail = async (correo) => {
  const query = `
    SELECT
      u.id,
      u.nombres,
      u.apellidos,
      u.correo,
      u.contrasena,
      u.id_rol,
      r.nombre AS rol,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'codigo', p.codigo,
            'nombre', p.nombre,
            'tipo', p.tipo,
            'recurso', p.recurso
          )
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) AS permisos,
      pd.id AS id_perfil_docente,
      pd.nombres AS perfil_nombres,
      pd.apellidos AS perfil_apellidos,
      al.id AS id_alumno
    FROM tbl_usuarios u
    JOIN tbl_roles r ON u.id_rol = r.id
    LEFT JOIN tbl_roles_permisos rp ON r.id = rp.id_rol AND rp.estado = 1
    LEFT JOIN tbl_permisos p ON rp.id_permiso = p.id AND p.estado = 1
    LEFT JOIN tbl_perfiles_docente pd ON u.id = pd.id_usuario AND pd.estado = 1
    LEFT JOIN tbl_alumnos al ON u.id = al.id_usuario AND al.estado = 1
    WHERE u.correo = $1
      AND u.estado = 1
    GROUP BY u.id, u.nombres, u.apellidos, u.correo, u.contrasena, u.id_rol, r.nombre, pd.id, pd.nombres, pd.apellidos, al.id
  `;

  const result = await pool.query(query, [correo]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

module.exports = { findUserByEmail };
