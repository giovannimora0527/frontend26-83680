package com.uniminuto.clinica.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.uniminuto.clinica.dto.CitaCoreDTO;
import com.uniminuto.clinica.dto.CitaRequest;
import com.uniminuto.clinica.dto.FormulaMedicaRequest;
import com.uniminuto.clinica.exception.BusinessException;
import com.uniminuto.clinica.repository.CatalogoRepository;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.FormulaMedicaRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

/** Pruebas unitarias de reglas críticas que deben protegerse en el backend. */
@ExtendWith(MockitoExtension.class)
class ReglasNegocioTest {
    @Mock private CitaRepository citas;
    @Mock private CatalogoRepository catalogos;
    @Mock private FormulaMedicaRepository formulas;

    /** Verifica que el backend impide agendar una mascota con un cliente diferente. */
    @Test
    void rechazaMascotaQueNoPerteneceAlCliente() {
        CitaService service = new CitaService(citas, catalogos);
        CitaRequest request = new CitaRequest(1L, 22L, 3L, LocalDateTime.now().plusDays(1), "Programada", "Consulta general");
        when(catalogos.existeClienteActivo(1L)).thenReturn(true);
        when(catalogos.mascotaPerteneceCliente(22L, 1L)).thenReturn(false);

        BusinessException error = assertThrows(BusinessException.class, () -> service.crear(request));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }

    /** Verifica que una fórmula no puede tener fecha de emisión anterior a la consulta. */
    @Test
    void rechazaFechaDeFormulaAnteriorALaCita() {
        FormulaMedicaService service = new FormulaMedicaService(formulas, citas, catalogos);
        LocalDateTime fechaCita = LocalDateTime.of(2026, 10, 10, 10, 0);
        when(citas.obtenerCore(10L)).thenReturn(new CitaCoreDTO(10L, 1L, 2L, 3L, fechaCita, "atendida"));
        when(catalogos.existeClienteActivo(1L)).thenReturn(true);
        when(catalogos.mascotaPerteneceCliente(2L, 1L)).thenReturn(true);
        when(catalogos.existeMedico(3L)).thenReturn(true);
        when(catalogos.existeMedicamento(7L)).thenReturn(true);
        FormulaMedicaRequest request = new FormulaMedicaRequest(10L, 7L, fechaCita.minusDays(1), "1 tableta", "cada 12 horas", "7 días", "Después de comida");

        BusinessException error = assertThrows(BusinessException.class, () -> service.crear(request));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }
}
