package com.uniminuto.clinica.exception;

import com.uniminuto.clinica.dto.ApiErrorDTO;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Centraliza las respuestas de error de todos los controladores REST. */
@RestControllerAdvice
public class GlobalExceptionHandler {
    /** Convierte errores de reglas de negocio en su respuesta HTTP correspondiente. */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiErrorDTO> manejarNegocio(BusinessException ex, HttpServletRequest request) {
        return respuesta(ex.getStatus(), ex.getMessage(), request);
    }

    /** Informa los campos inválidos que envía el cliente. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorDTO> manejarValidacion(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(this::mensajeCampo).distinct().collect(Collectors.joining("; "));
        return respuesta(HttpStatus.BAD_REQUEST, message, request);
    }

    /** Responde de forma clara cuando el JSON o una fecha no se pueden interpretar. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorDTO> manejarJson(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return respuesta(HttpStatus.BAD_REQUEST, "El cuerpo enviado no tiene el formato esperado. Verifique los campos y las fechas.", request);
    }

    /** Convierte violaciones de integridad de datos en HTTP 409 sin exponer SQL. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorDTO> manejarIntegridad(DataIntegrityViolationException ex, HttpServletRequest request) {
        return respuesta(HttpStatus.CONFLICT, "La operación entra en conflicto con información relacionada o duplicada.", request);
    }

    /** Informa indisponibilidad o fallo de acceso a datos sin exponer detalles internos. */
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiErrorDTO> manejarDatos(DataAccessException ex, HttpServletRequest request) {
        return respuesta(HttpStatus.SERVICE_UNAVAILABLE, "No fue posible acceder a la base de datos. Verifique la conexión e intente nuevamente.", request);
    }

    /** Captura fallos no previstos con un mensaje genérico. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorDTO> manejarGeneral(Exception ex, HttpServletRequest request) {
        return respuesta(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error interno. Intente nuevamente o contacte al administrador.", request);
    }

    /** Obtiene el nombre y el mensaje de validación de un campo inválido. */
    private String mensajeCampo(FieldError fieldError) {
        return fieldError.getField() + ": " + fieldError.getDefaultMessage();
    }

    /** Construye la respuesta uniforme para un error HTTP. */
    private ResponseEntity<ApiErrorDTO> respuesta(HttpStatus status, String message, HttpServletRequest request) {
        ApiErrorDTO body = new ApiErrorDTO(LocalDateTime.now(), status.value(), status.getReasonPhrase(), message, request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}
