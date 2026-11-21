package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.FormulaEstadoHistorial;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.repository.FormulaEstadoHistorialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Registra cada cambio de estado de una fórmula (formulación y despacho) con
 * usuario, fecha y hora.
 */
@Component
public class FormulaTrazabilidad {

    @Autowired
    private FormulaEstadoHistorialRepository repository;

    public void registrar(FormulaMedica f, String anterior, String nuevo, String observacion, Usuario usuario) {
        FormulaEstadoHistorial h = new FormulaEstadoHistorial();
        h.setFormulaId(f.getId());
        h.setEstadoAnterior(anterior);
        h.setEstadoNuevo(nuevo);
        h.setObservacion(observacion == null ? null
                : (observacion.length() > 500 ? observacion.substring(0, 500) : observacion));
        h.setUsuario(usuario);
        h.setFecha(LocalDateTime.now());
        repository.save(h);
    }
}
