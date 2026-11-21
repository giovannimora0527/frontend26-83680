package com.uniminuto.clinica.utils;

import java.util.List;
import java.util.Set;

/**
 * Estados, tipos y límites de negocio centralizados.
 */
public final class Constantes {

    private Constantes() {
    }

    // ------------------------------------------------------------ Citas
    public static final String CITA_PENDIENTE = "PENDIENTE";
    public static final String CITA_PROGRAMADA = "PROGRAMADA";
    public static final String CITA_CONFIRMADA = "CONFIRMADA";
    public static final String CITA_EN_ATENCION = "EN_ATENCION";
    public static final String CITA_ATENDIDA = "ATENDIDA";
    public static final String CITA_CANCELADA = "CANCELADA";
    /** Estados que ocupan agenda (todos menos cancelada). */
    public static final Set<String> CITA_ESTADOS_OCUPAN = Set.of(CITA_PENDIENTE, CITA_PROGRAMADA,
            CITA_CONFIRMADA, CITA_EN_ATENCION, CITA_ATENDIDA);
    /** Estados con los que se puede registrar una cita nueva. */
    public static final Set<String> CITA_ESTADOS_INICIALES = Set.of(CITA_PENDIENTE, CITA_PROGRAMADA, CITA_CONFIRMADA);
    public static final int CITA_DURACION_DEFECTO = 30;

    // ------------------------------------------------------------ Historia clínica
    public static final String HISTORIA_ABIERTA = "ABIERTA";
    public static final String HISTORIA_CERRADA = "CERRADA";

    // ------------------------------------------------------------ Fórmulas
    public static final String FORMULA_BORRADOR = "BORRADOR";
    public static final String FORMULA_CONFIRMADA = "CONFIRMADA";
    public static final String FORMULA_ANULADA = "ANULADA";

    // ------------------------------------------------------------ Despacho
    public static final String DESP_NO_APLICA = "NO_APLICA";
    public static final String DESP_PENDIENTE = "PENDIENTE_DESPACHO";
    public static final String DESP_EN_PREPARACION = "EN_PREPARACION";
    public static final String DESP_PARCIAL = "DESPACHO_PARCIAL";
    public static final String DESP_DESPACHADO = "DESPACHADO";
    public static final String DESP_PENDIENTE_DISPONIBILIDAD = "PENDIENTE_DISPONIBILIDAD";
    public static final String DESP_CANCELADO = "CANCELADO";
    /** Estados en los que la fórmula aparece en la bandeja de despacho. */
    public static final List<String> DESP_ESTADOS_BANDEJA = List.of(DESP_PENDIENTE, DESP_EN_PREPARACION,
            DESP_PARCIAL, DESP_PENDIENTE_DISPONIBILIDAD);

    // ------------------------------------------------------------ Inventario
    public static final String PRODUCTO_MEDICAMENTO = "MEDICAMENTO";
    public static final String PRODUCTO_INSUMO = "INSUMO";
    public static final String PRODUCTO_UTENSILIO = "UTENSILIO";
    public static final Set<String> TIPOS_PRODUCTO = Set.of(PRODUCTO_MEDICAMENTO, PRODUCTO_INSUMO, PRODUCTO_UTENSILIO);
    public static final String MOV_ENTRADA = "ENTRADA";
    public static final String MOV_SALIDA = "SALIDA";
    public static final String CONCEPTO_COMPRA = "COMPRA";
    public static final String CONCEPTO_CARGA_MASIVA = "CARGA_MASIVA";
    public static final String CONCEPTO_DISPENSACION = "DISPENSACION";
    public static final String CONCEPTO_REVERSION = "REVERSION_DISPENSACION";
    public static final String CONCEPTO_AJUSTE = "AJUSTE";
    public static final int DIAS_PROXIMO_VENCER = 30;
    public static final String REGEX_CODIGO_MEDICAMENTO = "^[A-Za-z0-9]{8}$";

    // ------------------------------------------------------------ Carga masiva
    public static final String CARGA_PREVISUALIZADA = "PREVISUALIZADA";
    public static final String CARGA_CONFIRMADA = "CONFIRMADA";
    public static final String CARGA_CANCELADA = "CANCELADA";
    public static final String FILA_VALIDA = "VALIDO";
    public static final String FILA_ERROR = "ERROR";
    public static final String FILA_IMPORTADA = "IMPORTADO";
    public static final String FILA_FALLIDA = "FALLIDO";

    // ------------------------------------------------------------ Tarifas
    public static final Set<String> TIPOS_SERVICIO = Set.of("CONSULTA", "PROCEDIMIENTO", "VACUNACION",
            "CIRUGIA", "LABORATORIO", "OTRO");

    // ------------------------------------------------------------ Facturación
    public static final String FAC_PENDIENTE = "PENDIENTE";
    public static final String FAC_PAGO_PARCIAL = "PAGO_PARCIAL";
    public static final String FAC_PAGADA = "PAGADA";
    public static final String FAC_ANULADA = "ANULADA";
    public static final String ITEM_SERVICIO = "SERVICIO";
    public static final String ITEM_PRODUCTO = "PRODUCTO";
    public static final Set<String> METODOS_PAGO = Set.of("EFECTIVO", "TARJETA_DEBITO", "TARJETA_CREDITO",
            "TRANSFERENCIA");

    // ------------------------------------------------------------ Fórmulas: vías
    public static final Set<String> VIAS_ADMINISTRACION = Set.of("ORAL", "TOPICA", "OFTALMICA", "OTICA",
            "SUBCUTANEA", "INTRAMUSCULAR", "INTRAVENOSA", "INHALADA", "RECTAL");
}
