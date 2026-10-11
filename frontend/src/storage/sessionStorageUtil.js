// Igual que localStorage.js, pero usando sessionStorage:
// los datos se borran solos cuando se cierra el navegador/pestaña,
// así la sesión no se recuerda entre una apertura del programa y otra.
export const obtenerItem = (clave, valorInicial = null) => {
  try {
    const item = sessionStorage.getItem(clave);
    return item ? JSON.parse(item) : valorInicial;
  } catch {
    return valorInicial;
  }
};

export const guardarItem = (clave, valor) => {
  sessionStorage.setItem(clave, JSON.stringify(valor));
};

export const eliminarItem = (clave) => {
  sessionStorage.removeItem(clave);
};
