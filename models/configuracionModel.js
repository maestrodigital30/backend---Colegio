const prisma = require('../config/prisma');

const obtener = async () => {
  return prisma.tbl_configuracion_sistema.findFirst({ where: { estado: 1 } });
};

const actualizar = async (id, datos, userId) => {
  return prisma.tbl_configuracion_sistema.update({
    where: { id },
    data: {
      nombre_sistema: datos.nombre_sistema,
      color_primario: datos.color_primario,
      color_secundario: datos.color_secundario,
      color_acento: datos.color_acento || null,
      id_usuario_modificacion: userId,
      fecha_hora_modificacion: new Date(),
    },
  });
};

const obtenerActivo = async (tipo) => {
  return prisma.tbl_activos_marca.findFirst({
    where: { tipo_activo: tipo, esta_activo: true, estado: 1 },
  });
};

const actualizarActivo = async (tipo, url, userId) => {
  await prisma.tbl_activos_marca.updateMany({
    where: { tipo_activo: tipo, esta_activo: true },
    data: { esta_activo: false },
  });

  return prisma.tbl_activos_marca.create({
    data: {
      tipo_activo: tipo,
      url_archivo: url,
      esta_activo: true,
      id_usuario_registro: userId,
    },
  });
};

const desactivarActivo = async (tipo) => {
  return prisma.tbl_activos_marca.updateMany({
    where: { tipo_activo: tipo, esta_activo: true },
    data: { esta_activo: false },
  });
};

const obtenerLogo = () => obtenerActivo('logo');
const actualizarLogo = (url, userId) => actualizarActivo('logo', url, userId);
const obtenerFondoLogin = () => obtenerActivo('fondo_login');
const actualizarFondoLogin = (url, userId) => actualizarActivo('fondo_login', url, userId);
const eliminarFondoLogin = () => desactivarActivo('fondo_login');

module.exports = {
  obtener,
  actualizar,
  obtenerLogo,
  actualizarLogo,
  obtenerFondoLogin,
  actualizarFondoLogin,
  eliminarFondoLogin,
};
