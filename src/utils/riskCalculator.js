export const calcularNivelRiesgo = ({ tiene_disco, tiene_candado, tiene_seguridad_extra, cantidad_cerraduras_malas }) => {
  if (!tiene_disco) return 'CRITICO'
  if (cantidad_cerraduras_malas > 0 && !tiene_candado) return 'ALTO'
  if (cantidad_cerraduras_malas > 0) return 'ALTO'
  if (!tiene_candado) return 'MEDIO'
  if (!tiene_seguridad_extra) return 'MEDIO'
  return 'BAJO'
}

export const calcularImpactoEconomico = (cantidadRobos, valorDisco) => {
  const valor = Number(valorDisco)
  if (isNaN(valor) || valor <= 0) return 0
  return cantidadRobos * valor
}
