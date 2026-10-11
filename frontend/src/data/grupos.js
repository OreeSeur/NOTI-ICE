import { CARRERA_ICE, getSemestreLabel, TURNOS_GRUPO } from "../constants/academic";

const NUMEROS_GRUPO = Array.from({ length: 12 }, (_, index) => index + 1);
const SEMESTRES_GRUPO = Array.from({ length: 9 }, (_, index) => index + 1);
const TURNOS = ["CM", "CV"];

const crearGrupoBase = (semestreNumero, turnoCodigo, numeroGrupo) => {
  const nombre = `${semestreNumero}${turnoCodigo}${numeroGrupo}`;

  return {
    id: `grp-${nombre.toLowerCase()}`,
    nombre,
    carrera: CARRERA_ICE,
    semestre: getSemestreLabel(semestreNumero),
    semestreNumero,
    turnoCodigo,
    turno: TURNOS_GRUPO[turnoCodigo],
    numeroGrupo,
  };
};

export const grupos = SEMESTRES_GRUPO.flatMap((semestreNumero) =>
  TURNOS.flatMap((turnoCodigo) =>
    NUMEROS_GRUPO.map((numeroGrupo) =>
      crearGrupoBase(semestreNumero, turnoCodigo, numeroGrupo)
    )
  )
);
