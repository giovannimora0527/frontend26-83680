package com.uniminuto.clinica.serviceimpl;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Pruebas unitarias (sin base de datos) de reglas de cálculo y de lectura de la carga masiva.
 */
class ReglasCalculoTest {

    @Test
    void cantidadFormuladaEsDosisPorNumeroDeTomas() {
        // 1 tableta cada 12 h por 7 días = 14 tomas
        assertEquals(14, FormulaServiceImpl.calcularCantidad(BigDecimal.ONE, 12, 7));
        // 1.5 unidades cada 8 h por 7 días = 21 tomas x 1.5 = 31.5 -> 32 (se redondea hacia arriba)
        assertEquals(32, FormulaServiceImpl.calcularCantidad(new BigDecimal("1.5"), 8, 7));
        // cada 36 h por 3 días = 2 tomas
        assertEquals(2, FormulaServiceImpl.calcularCantidad(BigDecimal.ONE, 36, 3));
    }

    @Test
    void numerosEnFormatoColombianoEInternacional() {
        assertEquals(new BigDecimal("1500"), CargaMasivaFormato.decimal("1.500"));
        assertEquals(new BigDecimal("1500"), CargaMasivaFormato.decimal("$1,500"));
        assertEquals(new BigDecimal("1250000"), CargaMasivaFormato.decimal("1.250.000"));
        assertEquals(new BigDecimal("1500.50"), CargaMasivaFormato.decimal("1.500,50"));
        assertEquals(new BigDecimal("1500.50"), CargaMasivaFormato.decimal("1500.50"));
        assertEquals(new BigDecimal("4.5"), CargaMasivaFormato.decimal("4,5"));
        assertNull(CargaMasivaFormato.decimal("abc"));
        assertEquals(12, CargaMasivaFormato.entero("12.0"));
        assertNull(CargaMasivaFormato.entero("12.5"));
    }

    @Test
    void fechasEnVariosFormatos() {
        assertEquals(LocalDate.of(2026, 11, 15), CargaMasivaFormato.fecha("2026-11-15"));
        assertEquals(LocalDate.of(2026, 11, 15), CargaMasivaFormato.fecha("15/11/2026"));
        assertNull(CargaMasivaFormato.fecha("31/02/2026"));
    }

    @Test
    void encabezadosSeNormalizan() {
        assertEquals("fecha_vencimiento", CargaMasivaLector.normalizar(" Fecha Vencimiento "));
        assertEquals("codigo", CargaMasivaLector.normalizar("﻿Código"));
    }

    @Test
    void filaSerializadaSeRecuperaIgual() {
        Map<String, String> fila = new LinkedHashMap<>();
        fila.put("codigo", "AB=12:CD");
        fila.put("nombre", "Línea 1\nLínea 2");
        Map<String, String> leida = CargaMasivaFormato.deserializar(CargaMasivaFormato.serializar(fila));
        assertEquals("AB=12:CD", leida.get("codigo"));
        assertEquals("Línea 1\nLínea 2", leida.get("nombre"));
    }
}
