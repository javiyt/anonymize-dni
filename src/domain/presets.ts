import type { Preset } from './documentTypes'

export const PRESETS: Preset[] = [
  {
    id: 'basic',
    name: 'Protección básica',
    description:
      'Oculta firma, CAN y MRZ. Añade marca de agua. Recomendado para la mayoría de trámites.',
    grayscale: true,
    watermarkPurpose: 'TRÁMITE',
    recommendedRedactions: [
      'Firma',
      'CAN / número de soporte (dorso)',
      'MRZ · zona de lectura mecánica (dorso)',
      'Código de barras o QR',
    ],
  },
  {
    id: 'strong',
    name: 'Protección fuerte',
    description:
      'Oculta foto, firma, CAN, MRZ, fechas y dirección. Máxima protección manteniendo nombre y DNI.',
    grayscale: true,
    watermarkPurpose: 'USO RESTRINGIDO',
    recommendedRedactions: [
      'Fotografía (o parte de ella)',
      'Firma',
      'CAN / número de soporte (dorso)',
      'MRZ · zona de lectura mecánica (dorso)',
      'Fecha de caducidad',
      'Fecha de expedición',
      'Dirección',
      'Código de barras o QR',
    ],
  },
  {
    id: 'identity',
    name: 'Solo verificación de identidad',
    description:
      'Para verificar quién eres. Oculta todo salvo nombre y número de DNI/NIE.',
    grayscale: true,
    watermarkPurpose: 'SOLO VERIFICACIÓN DE IDENTIDAD',
    recommendedRedactions: [
      'Fotografía (o parte de ella)',
      'Firma',
      'CAN / número de soporte (dorso)',
      'MRZ · zona de lectura mecánica (dorso)',
      'Fecha de nacimiento (si no se exige)',
      'Fecha de caducidad',
      'Fecha de expedición',
      'Dirección',
      'Código de barras o QR',
    ],
  },
  {
    id: 'rental',
    name: 'Alquiler / Reserva',
    description:
      'Para contratos de alquiler, reservas de hotel u otras gestiones similares.',
    grayscale: true,
    watermarkPurpose: 'ALQUILER / RESERVA',
    recommendedRedactions: [
      'Firma',
      'CAN / número de soporte (dorso)',
      'MRZ · zona de lectura mecánica (dorso)',
      'Código de barras o QR',
    ],
  },
  {
    id: 'admin',
    name: 'Trámite administrativo',
    description:
      'Para trámites con administraciones públicas. Incluye los datos mínimos necesarios.',
    grayscale: true,
    watermarkPurpose: 'TRÁMITE ADMINISTRATIVO',
    recommendedRedactions: [
      'Firma',
      'CAN / número de soporte (dorso)',
      'MRZ · zona de lectura mecánica (dorso)',
      'Dirección (si no se exige)',
      'Código de barras o QR',
    ],
  },
  {
    id: 'contract',
    name: 'Compra-venta / Contrato',
    description:
      'Para contratos de compraventa u otros documentos legales que requieren identificación.',
    grayscale: true,
    watermarkPurpose: 'CONTRATO',
    recommendedRedactions: [
      'Firma',
      'CAN / número de soporte (dorso)',
      'MRZ · zona de lectura mecánica (dorso)',
      'Código de barras o QR',
    ],
  },
]
