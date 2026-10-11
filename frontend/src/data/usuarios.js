import { ROLES } from "../constants/roles";

export const usuarios = [
  {
    id: 1,
    nombre: "Administrador",
    correo: "admin@noti-ice.example",
    rol: ROLES.ADMIN,
    boleta: "DEMO-ADM-001",
    carrera: "Administración del Portal",
    semestre: "N/A",
  },
  {
    id: 2,
    nombre: "Alumno",
    correo: "alumno@noti-ice.example",
    rol: ROLES.ALUMNO,
    boleta: "DEMO-ALU-001",
    carrera: "Ingeniería en Comunicaciones y Electrónica",
    semestre: "2° Semestre",
    academicProfile: {
      plan: "2024",
      periodo: "2026-1",
      grupoId: "grp-2cm1",
      materiasIds: ["mat-2024-2-programacion-avanzada"],
      inscripciones: [
        {
          id: "insc-demo-alumno-programacion-avanzada-2cm1",
          plan: "2024",
          periodo: "2026-1",
          materiaId: "mat-2024-2-programacion-avanzada",
          grupoId: "grp-2cm1",
        },
      ],
    },
  },
  {
    id: 3,
    nombre: "Docente Demo",
    correo: "docente@noti-ice.example",
    rol: ROLES.DOCENTE,
    boleta: "DEMO-DOC-001",
    carrera: "Ingeniería en Comunicaciones y Electrónica",
    semestre: "N/A",
  },
  {
    id: 4,
    nombre: "Personal Administrativo Demo",
    correo: "personal@noti-ice.example",
    rol: ROLES.ADMIN,
    boleta: "DEMO-PER-001",
    carrera: "Servicios Escolares",
    semestre: "N/A",
  },
];
