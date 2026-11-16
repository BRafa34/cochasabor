export function errorHandler(error, _request, response, _next) {
  if (error.type === 'entity.parse.failed') {
    response.status(400).json({
      code: 'INVALID_JSON',
      message: 'El cuerpo de la solicitud no contiene JSON válido.',
    });
    return;
  }
  if (error.type === 'entity.too.large') {
    response.status(413).json({
      code: 'REQUEST_TOO_LARGE',
      message: 'El cuerpo de la solicitud supera el tamaño permitido.',
    });
    return;
  }
  console.error('Error de API:', error);
  response.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Ocurrió un error al procesar la solicitud.',
  });
}
