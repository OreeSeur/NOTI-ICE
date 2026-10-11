export const obtenerItem = (clave, valorInicial = null) => {
  try {
    const item = localStorage.getItem(clave);
    return item ? JSON.parse(item) : valorInicial;
  } catch {
    return valorInicial;
  }
};

export const guardarItem = (clave, valor) => {
  localStorage.setItem(clave, JSON.stringify(valor));
};

export const eliminarItem = (clave) => {
  localStorage.removeItem(clave);
};
