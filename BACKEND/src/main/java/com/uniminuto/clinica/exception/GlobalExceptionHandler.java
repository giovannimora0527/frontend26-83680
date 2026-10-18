package com.uniminuto.clinica.exception;

import com.uniminuto.clinica.exception.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Manejador global de errores de la API. Traduce cada excepción a una respuesta
 * JSON consistente ({@link ErrorResponse}) con el código HTTP correcto y un mensaje
 * entendible, sin exponer detalles técnicos al usuario.
 *
 * @author Juan Kamilo Rodriguez Diaz
 * @version 2.0
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Registro de eventos para dejar el detalle técnico solo en el log del servidor. */
    private static final Logger LOG = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Construye la respuesta de error estándar.
     *
     * @param status  Estado HTTP a devolver.
     * @param error   Etiqueta corta del tipo de error.
     * @param message Mensaje para el usuario.
     * @return Respuesta lista para devolver al cliente.
     */
    private ResponseEntity<ErrorResponse> construir(HttpStatus status, String error, String message) {
        return ResponseEntity.status(status).body(new ErrorResponse(status.value(), error, message));
    }

    /**
     * Maneja solicitudes inválidas (400) lanzadas por el proyecto.
     *
     * @param ex Excepción original.
     * @return Respuesta 400.
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex) {
        return construir(ex.getStatus(), "BAD REQUEST", ex.getMessage());
    }

    /**
     * Maneja la excepción de Tomcat usada por los módulos existentes (Mascota, Raza, etc.),
     * para que también respondan con 400 y un JSON consistente en lugar de un 500.
     *
     * @param ex Excepción original.
     * @return Respuesta 400.
     */
    @ExceptionHandler(org.apache.coyote.BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleCoyoteBadRequest(org.apache.coyote.BadRequestException ex) {
        return construir(HttpStatus.BAD_REQUEST, "BAD REQUEST", ex.getMessage());
    }

    /**
     * Maneja registros inexistentes (404).
     *
     * @param ex Excepción original.
     * @return Respuesta 404.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return construir(ex.getStatus(), "NOT FOUND", ex.getMessage());
    }

    /**
     * Maneja conflictos con información existente, como cruces de horario (409).
     *
     * @param ex Excepción original.
     * @return Respuesta 409.
     */
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(ConflictException ex) {
        return construir(ex.getStatus(), "CONFLICT", ex.getMessage());
    }

    /**
     * Maneja violaciones de reglas de negocio (422).
     *
     * @param ex Excepción original.
     * @return Respuesta 422.
     */
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRule(BusinessRuleException ex) {
        return construir(ex.getStatus(), "BUSINESS RULE", ex.getMessage());
    }

    /**
     * Maneja un cuerpo JSON mal formado o con valores de tipo incorrecto (fechas mal escritas, etc.).
     *
     * @param ex Excepción original.
     * @return Respuesta 400 con un mensaje genérico.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleNotReadable(HttpMessageNotReadableException ex) {
        LOG.warn("Cuerpo de petición no legible: {}", ex.getMessage());
        return construir(HttpStatus.BAD_REQUEST, "BAD REQUEST",
                "Los datos enviados no tienen el formato esperado. Revise los campos e intente de nuevo.");
    }

    /**
     * Maneja parámetros de URL con un tipo incorrecto (por ejemplo, un id no numérico o una fecha inválida).
     *
     * @param ex Excepción original.
     * @return Respuesta 400.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return construir(HttpStatus.BAD_REQUEST, "BAD REQUEST",
                "El valor del parámetro '" + ex.getName() + "' no es válido.");
    }

    /**
     * Maneja parámetros obligatorios ausentes en la URL.
     *
     * @param ex Excepción original.
     * @return Respuesta 400.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException ex) {
        return construir(HttpStatus.BAD_REQUEST, "BAD REQUEST",
                "Falta el parámetro obligatorio '" + ex.getParameterName() + "'.");
    }

    /**
     * Maneja violaciones de integridad de la base de datos (llaves foráneas, únicos) como último
     * respaldo de las validaciones del servicio.
     *
     * @param ex Excepción original.
     * @return Respuesta 409 con un mensaje genérico.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleIntegrity(DataIntegrityViolationException ex) {
        LOG.error("Violación de integridad de datos", ex);
        return construir(HttpStatus.CONFLICT, "CONFLICT",
                "No fue posible guardar la información porque entra en conflicto con datos existentes o relacionados.");
    }

    /**
     * Último respaldo: cualquier error no previsto responde 500 con un mensaje genérico.
     * El detalle técnico queda solo en el log del servidor.
     *
     * @param ex Excepción original.
     * @return Respuesta 500 sin información técnica.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        LOG.error("Error inesperado", ex);
        return construir(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL SERVER ERROR",
                "Ocurrió un error inesperado. Intente nuevamente o comuníquese con el administrador.");
    }
}
