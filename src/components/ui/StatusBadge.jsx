const DISCO_STYLES = {
  true: 'bg-green-100 text-green-700 border border-green-200',
  false_srl: 'bg-blue-100 text-blue-700 border border-blue-200',
  false_robo: 'bg-red-100 text-red-700 border border-red-200',
  false_unknown: 'bg-gray-100 text-gray-600 border border-gray-200'
}

const TICKET_STYLES = {
  ABIERTO: 'bg-red-100 text-red-700 border border-red-200',
  EN_REVISION: 'bg-amber-100 text-amber-700 border border-amber-200',
  CERRADO: 'bg-green-100 text-green-700 border border-green-200',
  DESCARTADO: 'bg-gray-100 text-gray-500 border border-gray-200'
}

const SRL_STYLES = {
  PENDIENTE_ENVIO: 'bg-gray-100 text-gray-600 border border-gray-200',
  ENVIADO_SRL: 'bg-blue-100 text-blue-700 border border-blue-200',
  EN_REPARACION: 'bg-amber-100 text-amber-700 border border-amber-200',
  RECIBIDO_SRL: 'bg-sky-100 text-sky-700 border border-sky-200',
  REPUESTO_BUS: 'bg-green-100 text-green-700 border border-green-200',
  CERRADO: 'bg-gray-100 text-gray-500 border border-gray-200'
}

const RIESGO_STYLES = {
  BAJO: 'bg-green-100 text-green-700 border border-green-200',
  MEDIO: 'bg-amber-100 text-amber-700 border border-amber-200',
  ALTO: 'bg-orange-100 text-orange-700 border border-orange-200',
  CRITICO: 'bg-red-100 text-red-700 border border-red-200'
}

const LABELS = {
  ticket: { ABIERTO: 'Abierto', EN_REVISION: 'En revisión', CERRADO: 'Cerrado', DESCARTADO: 'Descartado' },
  srl: {
    PENDIENTE_ENVIO: 'Pendiente envío',
    ENVIADO_SRL: 'Enviado a SRL',
    EN_REPARACION: 'En reparación',
    RECIBIDO_SRL: 'Recibido desde SRL',
    REPUESTO_BUS: 'Repuesto en bus',
    CERRADO: 'Cerrado'
  },
  riesgo: { BAJO: 'Riesgo bajo', MEDIO: 'Riesgo medio', ALTO: 'Riesgo alto', CRITICO: 'Crítico' }
}

export const DiscoBadge = ({ tieneDisco, motivo }) => {
  let styleKey, label
  if (tieneDisco) {
    styleKey = 'true'; label = 'Con disco'
  } else if (motivo === 'RETIRADO_SRL') {
    styleKey = 'false_srl'; label = 'SRL'
  } else if (motivo === 'POSIBLE_ROBO') {
    styleKey = 'false_robo'; label = 'Posible robo'
  } else {
    styleKey = 'false_unknown'; label = 'Sin disco'
  }
  return (
    <span className={`badge ${DISCO_STYLES[styleKey]}`}>{label}</span>
  )
}

export const CandadoBadge = ({ tieneCandado }) => (
  <span className={`badge ${tieneCandado
    ? 'bg-green-100 text-green-700 border border-green-200'
    : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
    {tieneCandado ? 'Con candado' : 'Sin candado'}
  </span>
)

export const TicketBadge = ({ estado }) => (
  <span className={`badge ${TICKET_STYLES[estado] || 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
    {LABELS.ticket[estado] || estado}
  </span>
)

export const SRLBadge = ({ estado }) => (
  <span className={`badge ${SRL_STYLES[estado] || 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
    {LABELS.srl[estado] || estado}
  </span>
)

export const RiesgoBadge = ({ nivel }) => (
  <span className={`badge ${RIESGO_STYLES[nivel] || 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
    {LABELS.riesgo[nivel] || nivel}
  </span>
)

export const BoolBadge = ({ value, trueLabel = 'Sí', falseLabel = 'No', trueClass, falseClass }) => (
  <span className={`badge ${value
    ? (trueClass || 'bg-green-100 text-green-700 border border-green-200')
    : (falseClass || 'bg-red-100 text-red-700 border border-red-200')}`}>
    {value ? trueLabel : falseLabel}
  </span>
)
