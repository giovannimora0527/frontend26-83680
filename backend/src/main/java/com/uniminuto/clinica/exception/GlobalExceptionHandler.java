package com.uniminuto.clinica.exception;

import com.uniminuto.clinica.exception.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Manejador global de excepciones. Convierte cada excepción en una respuesta
 * HTTP con el código correcto y un cuerpo {@link ErrorResponse} consistente,
 * sin exponer información técnica al usuario.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Datos inválidos enviados por el cliente (HTTP 400).
     *
     * @param ex excepción de solicitud incorrecta.
     * @return respuesta de error con estado 400.
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(
            BadRequestException ex) {

        ErrorResponse error = new ErrorResponse(
                ex.getStatus().value(),
                "BAD REQUEST",
                ex.getMessage()
        );

        return ResponseEntity
                .status(ex.getStatus())
                .body(error);
    }

    /**
     * Registro inexistente (HTTP 404).
     *
     * @param ex excepción de registro no encontrado.
     * @return respuesta de error con estado 404.
     */
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
                ex.getStatus().value(),
                "NOT FOUND",
                ex.getMessage()
        );

        return ResponseEntity
                .status(ex.getStatus())
                .body(error);
    }

    /**
     * Conflicto con el estado actual de los datos (HTTP 409).
     *
     * @param ex excepción de conflicto.
     * @return respuesta de error con estado 409.
     */
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(ConflictException ex) {
        ErrorResponse error = new ErrorResponse(
                ex.getStatus().value(),
                "CONFLICT",
                ex.getMessage()
        );

        return ResponseEntity
                .status(ex.getStatus())
                .body(error);
    }

    /**
     * Cuerpo de la petición ilegible: JSON mal formado, fecha u hora con formato
     * inválido, texto donde se esperaba un número (HTTP 400).
     *
     * @param ex excepción de lectura del cuerpo.
     * @return respuesta de error con estado 400.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleMensajeIlegible(
            HttpMessageNotReadableException ex) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "BAD REQUEST",
                "Los datos enviados no tienen el formato esperado. "
                        + "Revise las fechas, las horas y los números."
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(error);
    }

    /**
     * Parámetro de la URL con un tipo incorrecto, por ejemplo una fecha mal
     * escrita o un identificador no numérico (HTTP 400).
     *
     * @param ex excepción de conversión de tipo.
     * @return respuesta de error con estado 400.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTipoIncorrecto(
            MethodArgumentTypeMismatchException ex) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "BAD REQUEST",
                "El valor del parámetro '" + ex.getName() + "' no es válido."
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(error);
    }

    /**
     * Falta un parámetro obligatorio de la URL (HTTP 400).
     *
     * @param ex excepción de parámetro faltante.
     * @return respuesta de error con estado 400.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleParametroFaltante(
            MissingServletRequestParameterException ex) {
        return construir(HttpStatus.BAD_REQUEST, "BAD REQUEST",
                "Falta el parámetro obligatorio '" + ex.getParameterName() + "'.");
    }

    /**
     * Ruta inexistente (HTTP 404). Sin este manejador el error genérico la
     * convertiría en un 500.
     *
     * @param ex excepción de recurso no encontrado.
     * @return respuesta de error con estado 404.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleRutaInexistente(NoResourceFoundException ex) {
        return construir(HttpStatus.NOT_FOUND, "NOT FOUND", "El servicio solicitado no existe.");
    }

    /**
     * Método HTTP no soportado por la ruta (HTTP 405).
     *
     * @param ex excepción de método no soportado.
     * @return respuesta de error con estado 405.
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMetodoNoSoportado(
            HttpRequestMethodNotSupportedException ex) {
        return construir(HttpStatus.METHOD_NOT_ALLOWED, "METHOD NOT ALLOWED",
                "La operación no está permitida para este servicio.");
    }

    /**
     * Tipo de contenido no soportado, por ejemplo un POST sin JSON (HTTP 415).
     *
     * @param ex excepción de tipo de contenido.
     * @return respuesta de error con estado 415.
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleTipoContenido(HttpMediaTypeNotSupportedException ex) {
        return construir(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED MEDIA TYPE",
                "Los datos deben enviarse en formato JSON.");
    }

    /**
     * Violación de una restricción de la base de datos (registro duplicado o
     * relación inexistente) que no alcanzó a detectar el servicio (HTTP 409).
     *
     * @param ex excepción de integridad de datos.
     * @return respuesta de error con estado 409.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleIntegridad(DataIntegrityViolationException ex) {
        log.warn("Violación de integridad de datos", ex);
        return construir(HttpStatus.CONFLICT, "CONFLICT",
                "La operación no se pudo completar porque el registro está duplicado "
                        + "o hace referencia a información inexistente.");
    }

    /**
     * Arma una respuesta de error con el formato estándar.
     *
     * @param estado  código HTTP.
     * @param error   nombre corto del error.
     * @param mensaje mensaje para el usuario.
     * @return respuesta de error.
     */
    private ResponseEntity<ErrorResponse> construir(HttpStatus estado, String error, String mensaje) {
        return ResponseEntity.status(estado).body(new ErrorResponse(estado.value(), error, mensaje));
    }

    /**
     * Cualquier error no controlado (HTTP 500). El detalle técnico solo queda
     * en el registro del servidor; al usuario se le muestra un mensaje genérico.
     *
     * @param ex excepción inesperada.
     * @return respuesta de error con estado 500.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        log.error("Error no controlado", ex);

        ErrorResponse error = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "INTERNAL SERVER_ERROR",
                "Ocurrió un error inesperado. Intente nuevamente."
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error);
    }
}
